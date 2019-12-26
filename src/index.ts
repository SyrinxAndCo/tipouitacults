// Init
import {Express} from "express"
import {Sequelize} from "sequelize"
import {Client, Guild, GuildMember, Message, MessageReaction, RichEmbed, TextChannel, User} from "discord.js"
import {EventEmitter} from "events"
import {Authorization, AuthorizationsCommand, Pub, Ticu} from "./types"

const crypto = require('crypto');
const CFG = require("./private.json")
const EXPRESS = require("express")
const EventsModule = require("events")
const fs = require('fs');

declare let Server: Express
declare let DB: Sequelize
declare let Discord: Client
declare let Event: EventEmitter
declare let PUB: Pub
declare let VotesFile: string
declare let VotesEmojis: string[]
declare let activeInvite: boolean
declare let TiCu: Ticu
declare let tipoui: Guild
declare let maxilog: TextChannel
declare let minilog: TextChannel

Server = EXPRESS()
DB = new Sequelize(CFG.sequelizeURL, {logging: false})
Discord = new Client({disabledEvents: ['TYPING_START']})
Event = new EventsModule.EventEmitter()
PUB = require("./public.json");
VotesFile = "private/votes.json";
VotesEmojis = ["✅","⚪","🛑","⏱"];
activeInvite = true
TiCu = {
  Date : require("./exports/date.js"),
  Log : require("./exports/log.js"),
  json : require("./exports/json.js"),
  Xp : require("./exports/xp.js"),
  Mention : require("./exports/mention.js"),
  Authorizations : require("./exports/authorizations.js"),
  VotesCollections : require("./exports/voteCollections.js"),
  Categories : require("./exports/categories.js"),
  Channels : require("./exports/channels.js"),
  Vote : require("./exports/vote.js"),
  Commands : {},
  Reactions : {
    heart : require("./exports/reactions/heart.js")
  },
  Auto : {
    suchTruc : require("./exports/auto/suchTruc.js")
  }
}

const commandFiles = fs.readdirSync('./exports/commands/');
for (const command of commandFiles) {
  const aux = require('./exports/commands/' + command)
  if (aux.alias && aux.activated) {
    for (const aliasCmd of aux.alias) {
      TiCu.Commands[aliasCmd] = aux
    }
  }
}

// Discord
Discord.login( CFG.discordToken )
Discord.once("ready", () => {
    tipoui = Discord.guilds.get(PUB.servers.commu)!!
    maxilog = Discord.channels.get(PUB.salons.maxiLog.id) as TextChannel
    minilog = Discord.channels.get(PUB.salons.miniLog.id) as TextChannel
    console.log(TiCu.Date("log") + " : Connexion à Discord.")
    //maxilog.send(TiCu.Date("log") + " : Reconnexion.")
    //minilog.send("Coucou, je suis de retour ♥")
    TiCu.VotesCollections.Startup()
    Server.get(
      "/discord/invite/:key",
      function(req, res) {
        const hash = crypto.createHmac('sha256', CFG.expressSalt)
          .update(TiCu.Date("raw").toString().substr(0,8))
          .digest('hex');
        if (activeInvite) {
          if (req.params.key === hash) {
            (Discord.channels.get(PUB.salons.invite.id) as TextChannel)
              .createInvite({maxUses: 1, maxAge: 300})
              .then(invite => {
                  res.send(invite.url)
                  TiCu.Log.ServerPage(req)
                }
              )
          } else {
            res.send("You should not try to overthink us")
          }
        } else {
          res.send("Raid ongoing, no invite creation at the moment")
        }
      }
    )
  })

function parseForAutoCommands(msg: Message) {
  for (const autoCommand of Object.values(TiCu.Auto)) {
    if (msg.content.indexOf(autoCommand.trigger) !== -1 && TiCu.Authorizations.Auto(autoCommand, msg)) {
      autoCommand.run(msg)
    }
  }
}

function createEmbedCopy(msg: Message, user: GuildMember, edited?: boolean, previousContent?: string) {
  let embed = new RichEmbed()
    .setColor(user.displayColor)
    .setAuthor(user.displayName, user.user.avatarURL, msg.url)
    .setDescription(edited ? previousContent : msg.content)
    .setTimestamp()
  if (edited) {
    embed.addField("Message édité", msg.content)
  }
  if(msg.attachments) {
    let attachments = Array.from(msg.attachments.values())
    for(let i=0;i<attachments.length;i++){
      embed.addField("Pièce-jointe URL #" + i, attachments[i].url)
      embed.addField("Pièce-jointe ProxyURL #" + i, attachments[i].proxyURL)
    }
  }
  return embed
}

function retrieveMessageForEdit(originMsg: Message, channel: string) {
  return (tipoui.channels.get(channel) as TextChannel).messages.find(
    msg => msg.author.bot && msg.embeds && msg.embeds[0].author.url === originMsg.url
  )
}

Discord.on("message", (msg) => {
  if(msg.author.id !== PUB.users.tipouitaculte && msg.author.id !== PUB.users.licorne) {
    TiCu.Xp.processXpFromMessage('add', msg)
    if(msg.channel.type === "dm" ) {
      let user = tipoui.members.get(msg.author.id) ? tipoui.members.get(msg.author.id) : undefined
      if(user) {
        if(!user.roles.find(e => e.id === PUB.roles.quarantaineRole.id)) {
          let embed = createEmbedCopy(msg, user);
          (tipoui.channels.get(PUB.salons.botsecret.id) as TextChannel).send(embed)
            .then(() => TiCu.Log.DM(embed, msg))
        } else msg.reply("utilise plutôt <#" + PUB.salons.quarantaineUser.id + "> s'il te plaît. Ce message n'a pas été transmis.")
      } else msg.reply("je ne parle qu'aux gens de Tipoui ♥")
    } else if(msg.channel.id === PUB.salons.quarantaineUser.id || msg.channel.id === PUB.salons.quarantaineVigi.id) {
      if(msg.channel.id === PUB.salons.quarantaineUser.id) {
        let user = msg.member;
        (tipoui.channels.get(PUB.salons.quarantaineVigi.id) as TextChannel).send(createEmbedCopy(msg, user))
          .then(newMsg => {if (newMsg instanceof Message) TiCu.Log.Quarantaine("reçu", newMsg, msg)})
      } else if(msg.channel.id === PUB.salons.quarantaineVigi.id) {
        (tipoui.channels.get(PUB.salons.quarantaineUser.id) as TextChannel).send(msg.content)
          .then(newMsg => { if (newMsg instanceof Message) TiCu.Log.Quarantaine("envoyé", newMsg, msg)})
      }
    } else if(msg.content.match(/^![a-zA-Z]/)) {
      let params: string[] = []
      msg.content.substring(1).split(/\s+/).forEach(value => {
        params.push(value.toLowerCase())
      })
      let cmd: string = params.shift()!!
      TiCu.Commands[cmd] ? TiCu.Authorizations.Command(cmd, msg) ? TiCu.Commands[cmd].run(params, msg) : TiCu.Log.Error(cmd, "permissions manquantes", msg) : msg.react("❓")
    } else {
      //parseForAutoCommands(msg)
    }
  }
})

Discord.on("messageDelete", (msg) => {
  if(msg.author.id !== PUB.users.tipouitaculte && msg.author.id !== PUB.users.licorne) {
    TiCu.Xp.processXpFromMessage('remove', msg)
  }
})

Discord.on("messageUpdate", (oldMsg, newMsg) => {
  if(oldMsg.author.id !== PUB.users.tipouitaculte && oldMsg.author.id !== PUB.users.licorne) {
    TiCu.Xp.processXpMessageUpdate(oldMsg, newMsg)
    if(newMsg.channel.type === "dm" ) {
      let user = tipoui.members.get(newMsg.author.id) ? tipoui.members.get(newMsg.author.id) : undefined
      if(user) {
        if(!user.roles.find(e => e.id === PUB.roles.quarantaineRole.id)) {
          const previousBotEmbed = retrieveMessageForEdit(oldMsg, PUB.salons.botsecret.id)
          if (previousBotEmbed) {
            let embed = createEmbedCopy(newMsg, user, true, previousBotEmbed.embeds[0].description)
            previousBotEmbed.edit(embed).then(() => TiCu.Log.UpdatedDM(embed, newMsg))
          } else TiCu.Log.UpdatedDM(undefined, newMsg, 'Could not find previous bot message to update')
        }
      }
    } else if(newMsg.channel.id === PUB.salons.quarantaineUser.id || newMsg.channel.id === PUB.salons.quarantaineVigi.id) {
      if (newMsg.channel.id === PUB.salons.quarantaineUser.id) {
        const previousBotEmbed = retrieveMessageForEdit(oldMsg, PUB.salons.quarantaineVigi.id)
        if (previousBotEmbed) {
          let embed = createEmbedCopy(newMsg, newMsg.member, true, previousBotEmbed.embeds[0].description)
          previousBotEmbed.edit(embed).then(msgEdited => TiCu.Log.UpdatedQuarantaine("reçu", msgEdited, newMsg))
        } else TiCu.Log.UpdatedQuarantaine("reçu", undefined, newMsg, 'Could not find previous bot message to update')
      } else if(newMsg.channel.id === PUB.salons.quarantaineVigi.id) {
        const previousBotEmbed = retrieveMessageForEdit(oldMsg, PUB.salons.quarantaineUser.id)
        if (previousBotEmbed) {
          let embed = createEmbedCopy(newMsg, newMsg.member, true, previousBotEmbed.embeds[0].description)
          previousBotEmbed.edit(embed).then(msgEdited => TiCu.Log.UpdatedQuarantaine("envoyé", msgEdited, newMsg))
        } else TiCu.Log.UpdatedQuarantaine("envoyé", undefined, newMsg, 'Could not find previous bot message to update')
      }
    }
  }
})

/**
 * Find the right reaction response and run the relevant command
 * @param reaction MessageReaction
 * @param usr User
 * @param type "add" | "remove"
 */
function parseReaction(reaction: MessageReaction, usr: User, type: string) {
  if (!usr.bot && !reaction.message.author.bot && reaction.message.guild.id === PUB.servers.commu) {
    TiCu.Xp.reactionXp(type, reaction, usr)
    let found = false
    for (const reactionFunction of Object.values(TiCu.Reactions)) {
      if (reaction.emoji.name === reactionFunction.emoji) {
        if (TiCu.Authorizations.Reaction(reactionFunction, reaction, usr)) {
          reactionFunction.run(reaction, usr, type)
        } else TiCu.Log.ReactionError(reaction, usr, type)
        found = true
      }
    }
    /* if (!found) TiCu.Log.Reactions.genericReaction(reaction, usr, type) */
  }
}

Discord.on("messageReactionAdd", (reaction, usr) => {
  parseReaction(reaction, usr, "add")
})
Discord.on("messageReactionRemove", (reaction, usr) => {
  parseReaction(reaction, usr, "remove")
})
Discord.on("guildMemberAdd", usr => {
  if(usr.guild.id === tipoui.id) {
    maxilog.send(TiCu.Date("log") + " : Arrivée de membre\n" + usr.user.toString() + " - " + usr.user.tag + " - " + usr.id)
    minilog.send("Arrivée de " + usr.user.toString() + " - " + usr.user.tag + " - " + usr.id);
    (tipoui.channels.get(PUB.salons.genTP.id) as TextChannel).send("Oh ! Bienvenue <@" + usr.id + "> ! Je te laisse lire les Saintes Règles, rajouter tes pronoms dans ton pseudo et nous faire une ptite présentation dans le salon qui va bien :heart:\nSi tu n'as pas fait vérifier ton numéro de téléphone ou d'abonnement Nitro, il va aussi te falloir aussi attendre 10 petites minutes que Discord s'assure tu n'es pas une sorte d'ordinateur mutant venu de l'espace... Même si en vrai ça serait trop cool quand même !")
  }
})
Discord.on("guildMemberRemove", usr => {
  if(usr.guild.id === tipoui.id) {
    maxilog.send(TiCu.Date("log") + " : Départ de membre\n" + usr.user.toString() + " - " + usr.user.tag + " - " + usr.id)
    minilog.send("Départ de " + usr.user.toString() + " - " + usr.user.tag + " - " + usr.id)
  }
})
Discord.on("guildMemberUpdate", (oldUsr, newUsr) => {
  if(newUsr.roles.get(PUB.roles.turquoise.id) && !oldUsr.roles.get(PUB.roles.turquoise.id)) {
    newUsr.addRole(PUB.roles.turquoiseColor.id)
    newUsr.addRole(PUB.roles.vote.id);
    (tipoui.channels.get(PUB.salons.genTutu.id) as TextChannel).send("Bienvenue parmi les 💠Turquoises <@" + newUsr.id + "> ! <:turquoise_heart:417784485724028938>\nTu as désormais accès à de nouveaux salons, notamment <#453706061031931905> où tu pourras découvrir les spécificités de cette promotion. Par ailleurs, n'hésite pas à consulter <#453702956315836436> pour voir les rôles auxquels tu peux prétendre, et demande-les-moi par message privé.")
  }
  if(newUsr.roles.get(PUB.roles.luxure.id)) {
    if(!newUsr.roles.get(PUB.roles.hammer.id) && newUsr.roles.get(PUB.roles.demolisseureuse.id)) {newUsr.addRole(PUB.roles.hammer.id)}
    else if(newUsr.roles.get(PUB.roles.hammer.id) && !newUsr.roles.get(PUB.roles.demolisseureuse.id)) {newUsr.removeRole(PUB.roles.hammer.id)}
    if(!newUsr.roles.get(PUB.roles.naughty.id) && newUsr.roles.get(PUB.roles.grrrrl.id)) {newUsr.addRole(PUB.roles.naughty.id)}
    else if(newUsr.roles.get(PUB.roles.naughty.id) && !newUsr.roles.get(PUB.roles.grrrrl.id)) {newUsr.removeRole(PUB.roles.naughty.id)}
  } else if(oldUsr.roles.get(PUB.roles.luxure.id) && !newUsr.roles.get(PUB.roles.luxure.id)) {
    if(newUsr.roles.get(PUB.roles.hammer.id)) {newUsr.removeRole(PUB.roles.hammer.id)}
    if(newUsr.roles.get(PUB.roles.naughty.id)) {newUsr.removeRole(PUB.roles.naughty.id)}
  }
})

// Server
Server.listen(3000);
