import {Command, Pub, Ticu} from "../../types"
import {GuildMember, Message} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

export = new class implements Command{
  alias = [
    'vote'
  ]
  activated = true
  authorizations = {
    chans : {
      type: "any"
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "any"
  },
    name : "Vote",
    desc : "Lancer un vote public ou anonymisé, éventuellement pour kick/ban/turquoise.",
    schema : "!vote <anon|anonyme> <turquoise|kick|ban> <@>\nou\n!vote <anon|anonyme> <text> (texte)\nou\n!vote (texte)",
    channels : "Tous (public ou anon) ou Automodération/Salle des Votes (anon+kick/ban) ou Salle des Votes (anon+turquoise)",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    let crop: RegExp, target: GuildMember|undefined
    let anon = params[0] === "anon" || params[0] === "anonyme"
    let type = params[1]
    if(anon){
      if(type === "kick" || type === "ban") {
        if(msg.channel.id === PUB.salons.salleDesVotes.id || msg.channel.id === PUB.salons.automoderation.id) {
          if(params[2]) {
            let mention = TiCu.Mention(params[2])
            target = mention instanceof GuildMember ? mention : undefined
          } else { return TiCu.Log.Error("vote", "les votes de kick et de ban nécessitent une cible", msg)}
        } else {return TiCu.Log.Error("vote", "les votes de kick et de ban sont restreints aux salons <#" + PUB.salons.automoderation.id + "> et <#" + PUB.salons.salleDesVotes.id +">", msg)}
      } else if(type === "turquoise") {
        if(msg.channel.id === PUB.salons.salleDesVotes.id) {
          if(params[2]) {
            let mention = TiCu.Mention(params[2])
            target = mention instanceof GuildMember ? mention : undefined
          }else { return TiCu.Log.Error("vote", "les votes de passage Turquoise nécessitent une cible", msg)}
        } else {return TiCu.Log.Error("vote", "les votes de passage Turquoise sont restreints au salon <#" + PUB.salons.salleDesVotes.id + ">", msg)}
      } else if(type !== "text") {return TiCu.Log.Error("vote", "quel type de vote ?", msg)}
      if(target instanceof GuildMember && type !== "text") {return TiCu.Log.Error("vote", "cible invalide", msg)}
      crop = new RegExp(/^!vote\s+[^\s]+\s+/)
      if(!msg.content.match(crop)) {return TiCu.Log.Error("vote", "il manque des paramètres", msg)}
      msg.channel.send(TiCu.VotesCollections.CreateEmbedAnon(target!!, type, TiCu.Vote.voteThreshold(type)))
        .then(newMsg => {
          if (newMsg instanceof Message && TiCu.json(TiCu.Vote.createJsonForAnonVote(newMsg, target!!, type))) {
            TiCu.Vote.addReactionsToMessage(newMsg)
            TiCu.VotesCollections.Init(type, newMsg)
            TiCu.Log.Commands.Vote.Anon(type, params, newMsg, msg)
          } else TiCu.Log.Error("vote", "erreur d'enregistrement du vote", msg)
        })
    } else if(msg.channel.id === PUB.salons.salleDesVotes.id) {return TiCu.Log.Error("vote", "seuls les votes anonymisés sont autorisés dans <#" + PUB.salons.salleDesVotes.id + ">", msg)}
    else {
      TiCu.Vote.addReactionsToMessage(msg)
      TiCu.Log.Commands.Vote.Public(msg)
    }
  }
}
