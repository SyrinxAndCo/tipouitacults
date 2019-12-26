import {Pub, ReactionsCommand, Ticu} from "../../types"
import {GuildMember, MessageReaction} from "discord.js"

declare const PUB: Pub
declare const TiCu: Ticu

export = new class implements ReactionsCommand {
  name = "Heart"
  desc = "Very complex to trigger heart reaction"
  emoji= "❤️"
  authorizations = {
    messages : {
      type: "any",
      list: []
    },
    salons : {
      type: "whitelist",
      list: [PUB.debug.botsecret]
    },
    users : {
      type: "whitelist",
      list: ["205399579884126217", "222028577405665283"]
    }
  }
  run = function(reaction: MessageReaction, usr: GuildMember, type: string) {
    TiCu.Log.Reactions.Heart(reaction, usr.user, type)
  }
}
