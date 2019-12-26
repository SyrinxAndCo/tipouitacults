const fs = require("fs")
const emojiTable = {};
emojiTable[VotesEmojis[0]] = "oui";
emojiTable[VotesEmojis[1]] = "non";
emojiTable[VotesEmojis[2]] = "blanc";
emojiTable[VotesEmojis[3]] = "delai";

const results = {
  oui: "Proposition validée",
  non: "Proposition rejetée",
  delai: "Proposition ajournée"
}

function filterReactions(expectedEmojis) {
  return (reaction, user) => {return (!user.bot) && (expectedEmojis.includes(reaction.emoji.name))}
}

function checkThreshold(vote, collector) {
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

function updateVotes(reaction, collector) {
  let votesJSON = JSON.parse(fs.readFileSync(VotesFile))
  let msg = reaction.message
  let user
  for (const id of reaction.users.keyArray()) {
    if (id !== PUB.users.tipouitaculte) {
      user = id
      reaction.remove(user)
      break
    }
  }
  let alreadyVoted
  for (const emojiType of Object.values(emojiTable)) {
    if (votesJSON[msg.id].votes[emojiType].includes(user)) {
      alreadyVoted = emojiType
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
      tipoui.members.get(votesJSON[msg.id].target),
      votesJSON[msg.id].type,
      votesJSON[msg.id].threshold,
      votesJSON[msg.id]
    )
  )
  checkThreshold(votesJSON[msg.id], collector)
  TiCu.Log.VoteUpdate(user, emojiTable[reaction.emoji.name], msg)
}

function createCollector(type, msg) {
  TiCu.VotesCollections.Collectors[msg.id] = msg.createReactionCollector(filterReactions(VotesEmojis));
  TiCu.VotesCollections.Collectors[msg.id].on("collect", (reaction, collector) =>
    TiCu.VotesCollections.Collected(type, reaction, collector))
  TiCu.VotesCollections.Collectors[msg.id].on("end", (reactions, reason)  =>
    TiCu.VotesCollections.Done(type, reactions, reason, msg))
  TiCu.Log.VoteCollector(msg)
}

module.exports = {
  Init : (type, msg) => {
    createCollector(type, msg)
  },
  Startup : () => {
    let votesJSON = JSON.parse(fs.readFileSync(VotesFile).toString());
    for (const [id, entry] of Object.entries(votesJSON)) {
      if (typeof entry === "object") {
        tipoui.channels.get(entry.chan).fetchMessage(id).then(msg => {
          createCollector(entry.type, msg);
        })
      }
    }
  },
  Collectors : {},
  Collected : (type, reaction, collector) => {
      updateVotes(reaction, collector)
  },
  Done : (type, reactions, reason, msg) => {
    let votesJSON = JSON.parse(fs.readFileSync(VotesFile))
    let target = votesJSON[msg.id].target
    if (reason === "oui") {
      switch (type) {
        case "ban":
          tipoui.members.get(target).ban()
            .then(() => TiCu.Log.VoteDone(reason, type, msg, target))
          break
        case "kick":
          tipoui.members.get(target).kick()
            .then(() => TiCu.Log.VoteDone(reason, type, msg, target))
          break
        case "turquoise":
          tipoui.members.get(target).addRoles([PUB.roles.turquoise.id, PUB.roles.turquoiseColor.id])
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
        tipoui.members.get(votesJSON[msg.id].target),
        votesJSON[msg.id].type,
        votesJSON[msg.id].threshold,
        votesJSON[msg.id],
        results[reason]
      )
    )
    delete votesJSON[msg.id]
    fs.writeFileSync(VotesFile, JSON.stringify(votesJSON, null, 2))
  },
  CreateEmbedAnon: (target, type, threshold, voteJson = undefined, result = undefined) => {
    let nbVotes = 0
    if (voteJson !== undefined) {
      for (const votes of Object.values(voteJson.votes)) {
        nbVotes += votes.length
      }
    }
    const embed = new DiscordNPM.RichEmbed()
      .setColor(target.displayColor)
      .setAuthor(`Vote de ${type === "turquoise" ? "passage" : ""} ${type.toUpperCase()} pour ${target.displayName}`, target.user.avatarURL)
    for (const emoji of VotesEmojis) {
      embed.addField(emoji, voteJson !== undefined ? voteJson.votes[emojiTable[emoji]].length : 0, emoji !== VotesEmojis[3])
    }
    embed.addField("Votes nécessaires", threshold, true)
    embed.addField("Votes actuels", nbVotes, true)
    if (result !== undefined) {
      embed.addField("Résultat du vote", result)
    }
    return embed
  }
}
