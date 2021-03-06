import {MemberXPModel, MemberXPModelStatic, Pub, Ticu, TicuXp} from "../types"
import {Guild, GuildMember, Message, MessageReaction, TextChannel, User} from "discord.js"
import sequelize, {Sequelize} from "sequelize"

declare const PUB: Pub
declare const TiCu: Ticu
declare const tipoui: Guild
declare const DB: Sequelize

const XPLINEAR = 179
const XPJUMPPOWER = 1.5
const XPLEVELJUMPRATE = 5

const XPPERCHARACTER = 0.0027
const CHARACTERSJUMPRATE = 400
const CHARACTERJUMPPOWER = 1.2
const XPREACTION = 0.05
const XPREACTEDTO = 0.01

const LEVELMAX = 100

let MemberXP = <MemberXPModelStatic>DB.define('memberxp', {
  id: {
    type: sequelize.STRING,
    allowNull: false,
    primaryKey: true
  },
  xp: {
    type: sequelize.FLOAT
  },
  level: {
    type: sequelize.INTEGER
  },
  activated: {
    type: sequelize.BOOLEAN
  }
}, {
  timestamps: false
});

function xpByLevel(level: number) {
  return Math.floor(XPLINEAR * Math.pow(Math.ceil(level/XPLEVELJUMPRATE), XPJUMPPOWER) * level);
}

const levelToXP: number[] = []
for (let i=0;i<LEVELMAX;i++) {
  levelToXP[i] = xpByLevel(i)
}

function calculateLevelByXp(xp: number) {
  let level: number;
  for (level = 0; level < 50; level++) {
    if (xp < levelToXP[level]) break;
  }
  level--
  return level
}

function systemAccessAuthorised(msg: Message) {
  return msg.channel.type === 'text' && // is in a GuildChannel
    msg.guild.id === PUB.servers.commu // is in Tipoui Guild
}

function updateLevel(level: number, target: string) {
  return MemberXP.update(
    {
      level: level
    },
    {
      where: {
        id: target
      },
      returning: true
    }
  )
}

function levelChange(entry: MemberXPModel, newLevel: number, previousLevel: number) {
  TiCu.Log.XP.levelChange(entry, previousLevel)
  if (newLevel > previousLevel && newLevel%4 === 0 && newLevel !== 0) {
    TiCu.Vote.autoTurquoise(entry.id, newLevel/4)
  }
}

function categoryMultiplier(categoryId: string) {
  const category = TiCu.Categories.findById(categoryId)
  return category ? category.xpFactor : 1
}

function channelMultiplier(channelId: string) {
  const channel = TiCu.Channels.findById(channelId)
  return channel ? channel.xpFactor : 1
}

function xpFromMessage(msg: Message) {
  const charNb = msg.content.length
  return charNb * XPPERCHARACTER * Math.pow(Math.ceil(charNb / CHARACTERSJUMPRATE), CHARACTERJUMPPOWER) * categoryMultiplier((msg.channel as TextChannel).parent.id) * channelMultiplier(msg.channel.id)
}

export = new class implements TicuXp{
  updateXp = function (this: TicuXp, type: string, value: number, target: string) {
    let booster = 1
    for (const role of Object.values(PUB.roles)) {
      if (tipoui.members.get(target)!.roles.get(role.id)) booster = booster + role.xpAddedMultiplicator
    }
    value = value * booster
    MemberXP.findOrCreate({where: {id: target}, defaults: {level: 0, xp: 0, activated: true}}).then(
      ([entry, created]) => {
        if (created) {
          TiCu.Log.XP.newEntry(entry)
        }
        if (entry.activated) {
          const newLevel = calculateLevelByXp(entry.xp + (type === 'add' ? value : -value))
          MemberXP.update({
            xp: entry.xp + (type === 'add' ? value : -value),
            level: newLevel
          }, {
            where: {
              id: target
            },
            returning: true
          }).then(
            ([numberUpdated, entries]) => {
              if (numberUpdated === 0) {
                TiCu.Log.XP.error(this.errorTypes.NOUPDATE, target)
              } else if (numberUpdated !== 1) {
                TiCu.Log.XP.error(this.errorTypes.MULTIPLEUPDATE, target)
              } else {
                if (newLevel !== entry.level) {
                  levelChange(entries[0], newLevel, entry.level)
                }
              }
            }
          )
        }
      }
    )
  }
  updateAllXp = function (this: TicuXp, type: string, value: number) {
    MemberXP.update({
      xp: sequelize.literal(`xp ${type === 'add' ? '+' : '-'} ${value}`)
    }, {
      where: {
        activated: true
      },
      returning: true
    }).then(
      ([numberUpdated, entries]: [number, MemberXPModel[]]) => {
        for (let i=0;i<numberUpdated;i++) {
          const previousLevel = calculateLevelByXp(entries[i].xp + (type === 'add' ? -value : value))
          const currentLevel = calculateLevelByXp(entries[i].xp)
          if (previousLevel !== currentLevel) {
            updateLevel(currentLevel, entries[i].id).then(
              ([numberUpdated, subEntries]: [number, MemberXPModel[]]) => {
                if (numberUpdated === 0) {
                  TiCu.Log.XP.error(this.errorTypes.NOUPDATE, entries[i].id)
                } else if (numberUpdated !== 1) {
                  TiCu.Log.XP.error(this.errorTypes.MULTIPLEUPDATE, entries[i].id)
                } else {
                  levelChange(subEntries[0], currentLevel, previousLevel)
                }
              }
            )
          }
        }
      }
    )
  }
  processXpFromMessage = function (this: TicuXp, type: string, msg: Message) {
    if (systemAccessAuthorised(msg)) {
      this.updateXp(type, xpFromMessage(msg), msg.author.id)
    }
  }
  processXpMessageUpdate = function (this: TicuXp, oldMsg: Message, newMsg: Message) {
    if (systemAccessAuthorised(oldMsg)) {
      const oldXp = xpFromMessage(oldMsg)
      const newXp = xpFromMessage(newMsg)
      this.updateXp('add', newXp - oldXp, oldMsg.author.id)
    }
  }
  reactionXp = function (this: TicuXp, type: string, reaction: MessageReaction, usr: User) {
    if (systemAccessAuthorised(reaction.message)) {
      if (usr.id !== reaction.message.author.id && !usr.bot && !reaction.message.author.bot) {
        const categoryMul = categoryMultiplier((reaction.message.channel as TextChannel).parent.id)
        const channelMul = channelMultiplier(reaction.message.channel.id)
        this.updateXp(type, XPREACTION * categoryMul * channelMul, usr.id)
        this.updateXp(type, XPREACTEDTO * categoryMul * channelMul, reaction.message.author.id)
      }
    }
  }
  getMember = function(id: string) {
    return MemberXP.findByPk(id)
  }
  getXpByLevel = function(level: number) {
    return xpByLevel(level)
  }
  changeMemberStatus = function(this: TicuXp, target: string, activated: boolean, msg: Message) {
    MemberXP.update({
      activated: activated
    }, {
      where: {
        id: target
      },
      returning: true
    }).then(
      ([numberUpdated, entries]) => {
        if (numberUpdated === 0) {
          TiCu.Log.XP.error(this.errorTypes.NOUPDATE, target)
        } else if (numberUpdated !== 1) {
          TiCu.Log.XP.error(this.errorTypes.MULTIPLEUPDATE, target)
        } else {
          if (msg) msg.channel.send(`Le compte de ${(TiCu.Mention(target) as GuildMember).displayName} est maintenant ${entries[0].activated ? 'activé' : 'désactivé'} dans le système`)
          TiCu.Log.XP.statusChange(entries[0])
        }
      }
    )
  }
  resetEveryOneXp = function() {
    MemberXP.update({
      xp: 0,
      level: 0
    }, {
      where: {}
    })
  }
  errorTypes = {
    AUTOVOTE: 'autovote',
    MULTIPLEUPDATE: 'multipleUpdate',
    NOUPDATE: 'noUpdate'
  }
}
