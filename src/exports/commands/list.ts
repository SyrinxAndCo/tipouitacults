import {Command, Pub, Ticu} from "../../types"
import {GuildChannel, Message, Role} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

export = new class implements Command{
  alias = [
    'list'
  ]
  activated = true
  authorizations = {
    chans : {
      type: "whitelist",
      list: [PUB.salons.debug.id]
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "any"
  },
    name : "List",
    desc : "Lister les rôles et salons du serveur. Fonction de debug sans logs.",
    schema : "!list <roles|channels>",
    channels : "Bots Vigilant·es",
    authors : "Toustes",
    roleNames : "Tous"
  }
  run = function(params: string[], msg: Message) {
    if (params[0] == "roles" || params[0] == "channels") {
        let array = msg.guild[params[0]].array()
        array.sort(function(a: Role|GuildChannel,b: Role|GuildChannel) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)})
        let answer = ""
        array.forEach((element: Role|GuildChannel) => {
            answer += (element.name == "@everyone") ? "" : element.name +" : "+ element.id +"\n"
        })
        if (answer.length > 2000) {
            while (answer.length > 2000) {
                let index = answer.lastIndexOf("\n", 1995) + 1
                let shortAnswer = answer.substring(0, index)
                msg.channel.send(shortAnswer)
                answer = answer.replace(shortAnswer, "")
            }
        }
        msg.channel.send(answer)
    } else return msg.reply("\"roles\" ou \"channels\" s'il te plaît.")
  }
}
