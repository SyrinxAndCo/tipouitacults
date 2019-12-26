function authorized(authorization, value) {
  switch (authorization.type) {
    case "any":
      return true
    case "whitelist":
      return !!authorization.list.find(e => e === value)
    case "blacklist":
      return !authorization.list.find(e => e === value)
    default:
      return false
  }
}

module.exports = {
  Command : function(cmd, msg) {
    let target = TiCu.Commands[cmd].authorizations
    let chan = authorized(target.chans, msg.channel.id)
    let auth = authorized(target.auths, msg.author.id)
    let role
    if(target.roles.type != "any") {
      let array = Array.from(msg.member.roles.values())
      let filtered = array.filter(e => target.roles.list.includes(e.id))
      if(target.roles.type === "whitelist") {
        role = filtered.length ? true : false
      } else {
        role = filtered.length ? false : true
      }
    } else role = true
    return chan && role && auth
  },
  Reaction : function(reactionFunction, reaction, usr) {
    let messages = authorized(reactionFunction.authorizations.messages, reaction.message.id)
    let salons = authorized(reactionFunction.authorizations.salons, reaction.message.channel.id)
    let users = authorized(reactionFunction.authorizations.users, usr.id)
    return messages && salons && users
  },
  Auto : function(autoCommand, msg) {
    let salons = authorized(autoCommand.authorizations.salons, msg.channel.id)
    let users = authorized(autoCommand.authorizations.users, msg.author.id)
    return salons && users
  }
}
