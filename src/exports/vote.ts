import {Guild, GuildMember, Message, TextChannel} from "discord.js"
import {JsonTicu, Pub, Ticu, TicuVote} from "../types"

declare const PUB: Pub
declare const TiCu: Ticu
declare const VotesEmojis: string[]
declare const tipoui: Guild
declare const VotesFile: string

export = new class implements TicuVote {
  voteThreshold = function(type: string) {
    switch (type) {
      case "kick":
        return 8
      case "ban":
        return 12
      case "turquoise":
        return Math.floor(tipoui.roles.get(PUB.roles.turquoise.id)!!.members.size*42/100)
      case "text":
      default:
        return -1
    }
  }
  addReactionsToMessage = function(msg: Message) {
    msg.react(VotesEmojis[0])
      .then(async function() {
        await msg.react(VotesEmojis[1])
        await msg.react(VotesEmojis[2])
        await msg.react(VotesEmojis[3])
      })
  }
  createJsonForAnonVote= function (this: TicuVote, msg: Message, target: GuildMember, type: string) {
    let json: JsonTicu = {"action": "write", "content" :{}}
    json.target = VotesFile
    json.content[msg.id] = {}
    json.content[msg.id].date = TiCu.Date("fr")
    json.content[msg.id].chan = msg.channel.id
    json.content[msg.id].type = type
    if(target) {json.content[msg.id].target = target.id}
    json.content[msg.id].threshold = this.voteThreshold(type)
    json.content[msg.id].votes = {"oui":[], "non":[], "blanc":[], "delai":[]}
    return json
  }
  autoTurquoise = function(this: TicuVote, targetId: string, voteNumber: number) {
    const targetMember = tipoui.members.get(targetId)
    if (targetMember && !targetMember.roles.get(PUB.roles.turquoise.id)) {
      (tipoui.channels.get(PUB.salons.salleDesVotes.id) as TextChannel).send(`Vote automatique de passage Turquoise #${voteNumber} pour ${targetMember}`)
        .then(newMsg => {
          if (newMsg instanceof Message && TiCu.json(this.createJsonForAnonVote(newMsg, targetMember, 'turquoise'))) {
            TiCu.Vote.addReactionsToMessage(newMsg)
            TiCu.VotesCollections.Init('turquoise', newMsg)
            TiCu.Log.Commands.Vote.AutoTurquoise(newMsg, targetId, voteNumber)
          } else TiCu.Log.XP.error(TiCu.Xp.errorTypes.AUTOVOTE, targetId)
        })
    }
  }
}