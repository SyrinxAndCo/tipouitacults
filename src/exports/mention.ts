import {Channel, Client, Guild, GuildMember, Role} from "discord.js"
import {Pub} from "../types"

declare const Discord: Client
declare const tipoui: Guild
declare const PUB: Pub

export = function(param: string): Role|Channel|GuildMember|boolean|undefined {
  let target
  let snow = new RegExp(/(\d+)/)
  let role = new RegExp(/^<@&(\d+)>$/)
  let user = new RegExp(/^<@!?(\d+)>$/)
  let channel = new RegExp(/^<#(\d+)>$/)
  let discriminated = new RegExp(/#\d{4}$/)
  let type = param.match(role) ? "role" : param.match(user) ? "user" : param.match(channel) ? "channel" : param.match(discriminated) ? "discriminated" : param.match(snow) ? "snow" : "text"
  let snowVal = param.match(snow)!!
  switch (type) {
    case "role":
      target = tipoui.roles.get(snowVal[1])
      break
    case "user":
      target = tipoui.members.get(snowVal[1])
      break
    case "channel":
      target = Discord.channels.get(snowVal[1])
      break
    case "discriminated":
      target = tipoui.members.find(e => e.user.tag === param)
      break
    case "snow":
      if(tipoui.members.get(snowVal[1])) {
        target = tipoui.members.get(snowVal[1])
      } else if(Discord.channels.get(snowVal[1])) {
        target = Discord.channels.get(snowVal[1])
      } else if(tipoui.roles.get(snowVal[1])) {
        target = tipoui.roles.get(snowVal[1])
      } else {
        target = false
      }
      break
    case "text":
      if(tipoui.members.find(e => e.user.username === param)) {
        target = tipoui.members.find(e => e.user.username === param)
      } else if(tipoui.members.find(e => e.displayName === param)) {
        target = tipoui.members.find(e => e.displayName === param)
      } else if(tipoui.channels.find(e => e.name === param)) {
        target = tipoui.channels.find(e => e.name === param)
      } else if(Discord.guilds.get(PUB.servers.vigi)!.channels.find(e => e.name === param)) {
        target = Discord.guilds.get(PUB.servers.vigi)!.channels.find(e => e.name === param)
      } else if(Discord.guilds.get(PUB.debug.server)!.channels.find(e => e.name === param)) {
        target = Discord.guilds.get(PUB.debug.server)!.channels.find(e => e.name === param)
      } else if(tipoui.roles.find(e => e.name === param)) {
        target = tipoui.roles.find(e => e.name === param)
      } else {
        target = false
      }
      break
    default:
      target = false
      break
  }
  return target
}
