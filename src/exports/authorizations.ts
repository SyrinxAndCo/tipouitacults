import {Authorization, AutoCommand, ReactionsCommand, Ticu, TicuAuthorization} from "../types"
import {Message, MessageReaction, Role, User} from "discord.js"

declare const TiCu: Ticu

function authorized(authorization: Authorization, value: string) {
  switch (authorization.type) {
    case "any":
      return true
    case "whitelist":
      return !!authorization.list!.find(e => e === value)
    case "blacklist":
      return !authorization.list!.find(e => e === value)
    default:
      return false
  }
}

export = new class implements TicuAuthorization {
  Command = function(cmd: string, msg: Message) {
    let target = TiCu.Commands[cmd].authorizations
    let chan = authorized(target.chans, msg.channel.id)
    let auth = authorized(target.auths, msg.author.id)
    let role
    if(target.roles.type != "any") {
      let array = Array.from(msg.member.roles.values())
      let filtered = array.filter((e: Role) => target.roles.list!.includes(e.id))
      if(target.roles.type === "whitelist") {
        role = !!filtered.length
      } else {
        role = !filtered.length
      }
    } else role = true
    return chan && role && auth
  }
  Reaction = function(reactionFunction: ReactionsCommand, reaction: MessageReaction, usr: User) {
    let messages = authorized(reactionFunction.authorizations.messages, reaction.message.id)
    let salons = authorized(reactionFunction.authorizations.salons, reaction.message.channel.id)
    let users = authorized(reactionFunction.authorizations.users, usr.id)
    return messages && salons && users
  }
  Auto = function(autoCommand: AutoCommand, msg: Message) {
    let salons = authorized(autoCommand.authorizations.salons, msg.channel.id)
    let users = authorized(autoCommand.authorizations.users, msg.author.id)
    return salons && users
  }
}
