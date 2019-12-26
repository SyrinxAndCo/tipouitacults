import {JsonVote, Pub, Ticu, TicuVoteCollection} from "../types"
import {Guild, GuildMember, Message, MessageReaction, ReactionCollector, RichEmbed, TextChannel, User} from "discord.js"

declare const VotesFile: string
declare const VotesEmojis: string[]
declare const PUB: Pub
declare const TiCu: Ticu
declare const tipoui: Guild

const fs = require("fs")
const emojiTable: any = {};
emojiTable[VotesEmojis[0]] = "oui";
emojiTable[VotesEmojis[1]] = "non";
emojiTable[VotesEmojis[2]] = "blanc";
emojiTable[VotesEmojis[3]] = "delai";

const results = {
  oui: "Proposition validée",
  non: "Proposition rejetée",
  delai: "Proposition ajournée"
}

function filterReactions(expectedEmojis: string[]) {
  return (reaction: MessageReaction, user: User) => {return (!user.bot) && (expectedEmojis.includes(reaction.emoji.name))}
}

function checkThreshold(vote: JsonVote, collector: ReactionCollector) {
  if (vote.threshold === -1) {
    return false
  }
  switch (vote.type) {
    case "ban":
    case "kick":
    case "text":
      if (vote.votes.oui.length >= vote.threshold) {
        collector.stop("oui")
      }
      break
    case "turquoise":
      let nbVotes = 0
      for (const votes of Object.values(vote.votes)) {
        nbVotes += votes.length
      }
      if (nbVotes >= vote.threshold) {
        const nbVotesDelay = vote.votes.delai.length
        if (nbVotesDelay >= nbVotes) {
          collector.stop("delai")
        } else if ((vote.votes.oui.length + (vote.votes.blanc.length + nbVotesDelay)/2) / nbVotes >= 0.75) {
          collector.stop("oui")
        } else {
          collector.stop("non")
        }
      }
      break
    default:
      if (vote.votes.oui.length >= vote.threshold) {
        collector.stop("oui")
      } else if (vote.votes.non.length >= vote.threshold) {
        collector.stop("non")
      } else if (vote.votes.delai.length >= vote.threshold) {
        collector.stop("delai")
      }
  }
}

function updateVotes(reaction: MessageReaction, collector: ReactionCollector) {
  let votesJSON = JSON.parse(fs.readFileSync(VotesFile))
  let msg = reaction.message
  let user: string = ''
  for (const id of reaction.users.keyArray()) {
    if (id !== PUB.users.tipouitaculte) {
      user = id
      reaction.remove(user)
      break
    }
  }
  let alreadyVoted = ''
  for (const emojiType of Object.values(emojiTable)) {
    if (votesJSON[msg.id].votes[emojiType as string].includes(user)) {
      alreadyVoted = emojiType as string
    }
  }
  if (alreadyVoted) {
    votesJSON[msg.id].votes[alreadyVoted].splice(
      votesJSON[msg.id].votes[alreadyVoted].indexOf(user),
      1
    )
  }
  votesJSON[msg.id].votes[emojiTable[reaction.emoji.name]].push(user)
  if (votesJSON[msg.id].type === "turquoise" && emojiTable[reaction.emoji.name] !== alreadyVoted) {
    if (emojiTable[reaction.emoji.name] === "delai") {
      votesJSON[msg.id].threshold++
    } else if (alreadyVoted === "delai") {
      votesJSON[msg.id].threshold--
    }
  }
  fs.writeFileSync(VotesFile, JSON.stringify(votesJSON, null, 2))
  reaction.message.edit(
    TiCu.VotesCollections.CreateEmbedAnon(
      tipoui.members.get(votesJSON[msg.id].target)!!,
      votesJSON[msg.id].type,
      votesJSON[msg.id].threshold,
      votesJSON[msg.id]
    )
  )
  checkThreshold(votesJSON[msg.id], collector)
  TiCu.Log.VoteUpdate(user, emojiTable[reaction.emoji.name], msg)
}

function createCollector(type: string, msg: Message) {
  TiCu.VotesCollections.Collectors[msg.id] = msg.createReactionCollector(filterReactions(VotesEmojis));
  TiCu.VotesCollections.Collectors[msg.id].on("collect", (reaction: MessageReaction, collector: ReactionCollector) =>
    TiCu.VotesCollections.Collected(type, reaction, collector))
  TiCu.VotesCollections.Collectors[msg.id].on("end", (reactions: MessageReaction[], reason: string)  =>
    TiCu.VotesCollections.Done(type, reactions, reason, msg))
  TiCu.Log.VoteCollector(msg)
}

export = new class implements TicuVoteCollection {
  Init = (type: string, msg: Message) => {
    createCollector(type, msg)
  }
  Startup = () => {
    let votesJSON = JSON.parse(fs.readFileSync(VotesFile).toString());
    for (const [id, entry] of Object.entries(votesJSON)) {
      if (typeof entry === "object") {
        (tipoui.channels.get((entry as JsonVote).chan) as TextChannel).fetchMessage(id).then(msg => {
          createCollector((entry as JsonVote).type, msg);
        })
      }
    }
  }
  Collectors = {}
  Collected = (type: string, reaction: MessageReaction, collector: ReactionCollector) => {
      updateVotes(reaction, collector)
  }
  Done = (type: string, reactions: MessageReaction[], reason: string, msg: Message) => {
    let votesJSON = JSON.parse(fs.readFileSync(VotesFile))
    let target = votesJSON[msg.id].target
    if (reason === "oui") {
      switch (type) {
        case "ban":
          tipoui.members.get(target)!.ban()
            .then(() => TiCu.Log.VoteDone(reason, type, msg, target))
          break
        case "kick":
          tipoui.members.get(target)!.kick()
            .then(() => TiCu.Log.VoteDone(reason, type, msg, target))
          break
        case "turquoise":
          tipoui.members.get(target)!.addRoles([PUB.roles.turquoise.id, PUB.roles.turquoiseColor.id])
            .then(() => TiCu.Log.VoteDone(reason, type, msg, target))
          break
        case "text":
        default:
          TiCu.Log.VoteDone(reason, type, msg)
          break
      }
    } else {
      TiCu.Log.VoteDone(reason, type, msg, target)
    }
    msg.edit(
      TiCu.VotesCollections.CreateEmbedAnon(
        tipoui.members.get(votesJSON[msg.id].target)!!,
        votesJSON[msg.id].type,
        votesJSON[msg.id].threshold,
        votesJSON[msg.id],
        (results as any)[reason]
      )
    )
    delete votesJSON[msg.id]
    fs.writeFileSync(VotesFile, JSON.stringify(votesJSON, null, 2))
  }
  CreateEmbedAnon = (target: GuildMember, type: string, threshold: number, voteJson?: JsonVote|undefined, result?: string|undefined) => {
    let nbVotes = 0
    if (voteJson !== undefined) {
      for (const votes of Object.values(voteJson.votes)) {
        nbVotes += votes.length
      }
    }
    const embed = new RichEmbed()
      .setColor(target.displayColor)
      .setAuthor(`Vote de ${type === "turquoise" ? "passage" : ""} ${type.toUpperCase()} pour ${target.displayName}`, target.user.avatarURL)
    for (const emoji of VotesEmojis) {
      embed.addField(emoji, voteJson !== undefined ? (voteJson.votes as any)[emojiTable[emoji]].length : 0, emoji !== VotesEmojis[3])
    }
    embed.addField("Votes nécessaires", threshold, true)
    embed.addField("Votes actuels", nbVotes, true)
    if (result !== undefined) {
      embed.addField("Résultat du vote", result)
    }
    return embed
  }
}
