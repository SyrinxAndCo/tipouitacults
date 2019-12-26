import {Guild, GuildMember, Message, MessageReaction, RichEmbed, TextChannel, User} from "discord.js"
import {MemberXPModel, Pub, Ticu} from "../types"
import {Request} from "express"

declare const maxilog: TextChannel
declare const minilog: TextChannel
declare const TiCu: Ticu
declare const tipoui: Guild
declare const PUB: Pub

export = {
  Error : function(cmd: string, err: string, msg: Message) {
    if(cmd === "vote") {
      msg.channel.send("Erreur avec la commande `" + cmd + "` : " + err +".")
        .then(newMsg => {
          msg.delete()
          if (newMsg instanceof Message) newMsg.delete(10000)
        })
      maxilog.send(TiCu.Date("log") + " : Erreur : (`" + cmd + "`, " + err +")")
    } else {
      msg.reply("erreur avec la commande `" + cmd + "` : " + err +".")
      maxilog.send(TiCu.Date("log") + " : Erreur : (`" + cmd + "`, " + err +")")
    }
  },
  Json : function(type: string, target: string) {
    if(type === "err") maxilog.send(TiCu.Date("log") + " : JSON\nErreur JSON (" + target + ")")
    else maxilog.send(TiCu.Date("log") + " : JSON\n" + type + " - " + target)
  },
  Quarantaine : function(type: string, newMsg: Message, msg: Message) {
    maxilog.send(TiCu.Date("log") + " : Quarantaine - " + type + "\n" + newMsg.url)
    msg.react("💬")
  },
  UpdatedQuarantaine : function(type: string, newMsg: Message|undefined, msg: Message, error?: string) {
    if (error !== undefined) {
      maxilog.send(`${TiCu.Date("log")} : UpdatedQuarantaine Error\n${error}`)
    } else if(newMsg) {
      maxilog.send(TiCu.Date("log") + " : UpdatedQuarantaine - " + type + "\n" + newMsg.url)
      msg.react("✅")
    }
  },
  DM : function(embed: RichEmbed, msg: Message) {
    maxilog.send(TiCu.Date("log") + " : DM")
    maxilog.send(embed)
    msg.react("💬")
  },
  UpdatedDM : function(embed: RichEmbed|undefined, msg: Message, error?: string) {
    if (error !== undefined) {
      maxilog.send(`${TiCu.Date("log")} : UpdatedDM Error\n${error}`)
    } else {
      maxilog.send(TiCu.Date("log") + " : UpdatedDM", embed)
      msg.react("✅")
    }
  },
  VoteUpdate : function(usr: string, emoji: string, msg: Message) {
    const user = tipoui.members.get(usr)!!
    maxilog.send(TiCu.Date("log") + " : VoteCollections\n" + user.displayName + " a voté " + emoji + " sur le vote :\n" + msg.url)
    user.send("Votre vote `" + emoji + "` a bien été pris en compte.\n" + msg.url)
  },
  VoteCollector : function(msg: Message) {
    maxilog.send(TiCu.Date("log") + " : VoteCollections\nInitialisation du vote pour le message\n" + msg.url)
  },
  VoteDone : function (reason: string, type: string, msg: Message, target?: string) {
    if (type === "text") {
      maxilog.send(TiCu.Date("log") + " : VoteDone\nFin du vote pour le message\n" + msg.url)
    } else {
      maxilog.send(
        TiCu.Date("log") + " : VoteDone\nFin du vote (avec le resultat \"" + reason + "\") pour le message\n" + msg.url +
        "\nVote de " + type + " pour " + tipoui.members.get(target!!)!.displayName
      )
    }
  },
  ServerPage : function(req: Request) {
    maxilog.send(TiCu.Date("log") + " : Server\nServed Page : " + req.path)
  },
  Commands : {
    Ban : function(target: User, reason: string, msg: Message) {
      maxilog.send(TiCu.Date("log") + " : Ban \n" + msg.member.displayName + " a banni " + target.username + " / " + target.id + ".")
      minilog.send(msg.member.displayName + " a banni " + target.username + ".")
      if(reason) {
        maxilog.send("Raison : " + reason)
        minilog.send("Raison : " + reason)
      }
      msg.react("✅")
    },
    Bienvenue : function(target: GuildMember, msg: Message) {
      maxilog.send(TiCu.Date("log") + " : Bienvenue \n" + msg.member.displayName + " a souhaité la bienvenue à " + target.displayName + " / " + target.id + ".")
      minilog.send(msg.member.displayName + " a souhaité la bienvenue à " + target.displayName + ".");
      (tipoui.channels.get(PUB.salons.invite.id) as TextChannel).send("Bienvenue " + target.displayName + " ! <:patatecoeur:585795622846857256>\nTe voici désormais Phosphate d'Alumine. N'hésite pas à m'envoyer un message privé si tu as des questions sur le serveur ou un message à transmettre aux Vigiliant·es.\nNous espérons que tu seras à ton aise et que tout se passera bien.")
    },
    Color : function(action: string, color: string, msg: Message) {
      if(action === "switched") {
        if(color === "turquoise") {
          maxilog.send(TiCu.Date("log") + " : Color\n" + msg.member.displayName + " a réinitialisé sa couleur.")
          msg.react("✅")
        } else {
          maxilog.send(TiCu.Date("log") + " : Color\n" + msg.member.displayName + " a adopté la couleur " + color + ".")
          msg.react("✅")
        }
      }
      if(action === "deleted") {
        maxilog.send(TiCu.Date("log") + " : Color\n" + "La couleur " + color + " a été supprimée.")
        msg.react("✔")
      }
    },
    Kick : function(target: User, reason: string, msg: Message) {
      maxilog.send(TiCu.Date("log") + " : Kick \n" + msg.member.displayName + " a kické " + target.username + " / " + target.id + ".")
      minilog.send(msg.member.displayName + " a kické " + target.username + ".")
      if(reason) {
        maxilog.send("Raison : " + reason)
        minilog.send("Raison : " + reason)
      }
      msg.react("✅")
    },
    Purifier : function(target: GuildMember, msg: Message) {
      maxilog.send(TiCu.Date("log") + " : Purifier \n" + msg.member.displayName + " a ajouté " + target.displayName + " parmi les Pourfendeureuses de Cismecs.")
      minilog.send(msg.member.displayName + " a ajouté " + target.displayName + " parmi les Pourfendeureuses de Cismecs.")
      msg.react("✅")
    },
    Quarantaine : function(action: boolean, target: GuildMember, reason: string, msg: Message) {
      if(action) {
        minilog.send(msg.member.displayName + "a mis " + target.displayName + " en quarantaine.")
        maxilog.send(TiCu.Date("log") + " : Quarantaine\n" + msg.member.displayName + " a mis " + target.displayName + " / " + target.id + " en quarantaine.");
        (tipoui.channels.get(PUB.salons.quarantaineUser.id) as TextChannel).send("<@" + target.id + ">, tu as été placé·e en quarantaine. Tous les messages que tu transmetras dans ce salon seront transmis aux Vigilant·es, comme lorsque tu m'envoie un message privé, et je m'occuperais de transmettre leurs réponses.\n⚠Quitter le serveur alors que tu es ici te vaudra un ban immédiat.⚠")
        msg.react("✅")
      } else {
        minilog.send(msg.member.displayName + "a enlevé " + target.displayName + " de quarantaine.")
        maxilog.send(TiCu.Date("log") + " : Quarantaine\n" + msg.member.displayName + " a enlevé " + target.displayName + " / " + target.id + " de quarantaine.")
        msg.react("✅")
      }
      if(reason) {
        minilog.send("Raison : " + reason)
        maxilog.send("Raison : " + reason)
      }
    },
    Roles : function(target: GuildMember, action: string, roles: string[], msg: Message) {
      let author = msg.member ? msg.member.displayName : msg.author.username
      let roleNames = ""
      for(let i=0;i<roles.length;i++) {
        roleNames += "`" + tipoui.roles.get(roles[i])!.name + "` "
      }
      action = (action === "addRoles") ? "ajoué" : "enlevé"
      minilog.send(author + " a " + action + " des rôles à " + target.displayName)
      maxilog.send(TiCu.Date("log") + " : Roles\n" + author + " a " + action + " des rôles à " + target.displayName + "\n" + roleNames)
      msg.react("✅")
    },
    Send : function(cmdMsg: Message, newMsg: Message) {
      let author = cmdMsg.member ? cmdMsg.member.displayName : cmdMsg.author.username
      maxilog.send(TiCu.Date("log") + " : Send \n" + author + " a envoyé un message vers `" + newMsg.channel.toString() + "`\n" + newMsg.url)
      maxilog.send(newMsg.toString())
      minilog.send(author + " a envoyé un message vers " + newMsg.channel.toString())
      cmdMsg.react("✅")
    },
    Vote : {
      Public : function(msg: Message) {
        minilog.send(msg.member.displayName + " a lancé un vote public")
        maxilog.send(TiCu.Date("log") + " : Vote\n" + msg.member.displayName + " a lancé un vote public :\n" + msg.url)
        maxilog.send(msg.content)
      },
      Anon : function(type: string, params: string[], newMsg: Message, msg: Message) {
        /* Might receive empty params[2] */
        if(type === "text") {
          minilog.send(msg.member.displayName + " a lancé un vote anonyme")
        } else {
          minilog.send(msg.member.displayName + " a lancé un vote anonyme pour " + type + " " + TiCu.Mention(params[2]) )
          maxilog.send(TiCu.Date("log") + " : Vote\n" + msg.member.displayName + " a lancé un vote anonyme : " + type + TiCu.Mention(params[2]) + "\n" + msg.url)
        }
        maxilog.send(newMsg.content)
        msg.delete()
      },
      AutoTurquoise: function(newMsg: Message, target: string, voteNumber: number) {
        minilog.send(`Un nouveau vote anonyme automatique de passage Turquoise (#${voteNumber}) a été lancé pour ${TiCu.Mention(target)}`)
        maxilog.send(newMsg.content)
      }
    },
    Level: function(target: string) {
      maxilog.send(`${TiCu.Date("log")} : Level\nImpossible de retrouver l'entrée correspondant à l'id membre ${target} en base de donnée`)
    },
    XPStatus: function(target: string) {
      maxilog.send(`${TiCu.Date("log")} : XPStatus\nImpossible de retrouver l'entrée correspondant à l'id membre ${target} en base de donnée`)
    },
    Xp: function(msg: Message, target: string, value: string, give: boolean) {
      maxilog.send(`${TiCu.Date("log")} : XP\n${tipoui.members.get(msg.author.id)!.displayName} ${give ? 'gave' : 'took'} ${value} XP ${give ? 'to' : 'from'} ${target}`)
    },
    Raid: function(msg: Message, arg: string) {
      maxilog.send(`${TiCu.Date("log")} : Raid\n<@${msg.author.id}> ${arg === 'on' ? 'activated' : 'desactivated'} the raid mode`)
      msg.react("✅")
    },
    Avatar: function(msg: Message, target: GuildMember) {
      maxilog.send(`${TiCu.Date("log")} : Avatar\n${(TiCu.Mention(msg.author.id) as GuildMember).displayName} displayed ${target.displayName}'s avatar`)
    }
  },
  ReactionError: function(reaction: MessageReaction, usr: User, type: string) {
    let errorText;
    if (type === "add") {
      errorText = tipoui.members.get(usr.id)!.displayName + " tried to trigger a bot reaction by reacting to " + reaction.message.url + " with " + reaction.emoji.name
    } else {
      errorText = tipoui.members.get(usr.id)!.displayName + " tried to trigger a bot reaction by deleting their reaction " + reaction.emoji.name + " to " + reaction.message.url
    }
    maxilog.send(TiCu.Date("log") + " : ReactionError\nSomething went wrong with authorizations\n" + errorText)
  },
  Reactions: {
    genericReaction: function(reaction: MessageReaction, usr: User, type: string) {
      if (type === "add") {
        maxilog.send(TiCu.Date("log") + " : ReactionAdd\n" + tipoui.members.get(usr.id)!.displayName + " a réagit à " + reaction.message.url + " avec " + reaction.emoji.name)
      } else {
        maxilog.send(TiCu.Date("log") + " : ReactionRemove\n" +tipoui.members.get(usr.id)!.displayName + " a supprimé sa réaction " + reaction.emoji.name + " à " + reaction.message.url)
      }
    },
    Heart: function(reaction: MessageReaction, usr: User, type: string) {
      if (type === "add") {
        maxilog.send(TiCu.Date("log") + " : ReactionHeartAdd\n" + tipoui.members.get(usr.id)!.displayName + " a ajouté un coeur à " + reaction.message.url)
      } else {
        maxilog.send(TiCu.Date("log") + " : ReactionHeartRemove\n" +tipoui.members.get(usr.id)!.displayName + " a retiré un coeur à " + reaction.message.url)
      }
    }
  },
  Auto: {
    SuchTruc: function(msg: Message) {
      maxilog.send(TiCu.Date("log") + " : SuchTruc\nSuch Log, much info !" + msg.url)
    }
  },
  XP: {
    newEntry: function(entry: MemberXPModel) {
      maxilog.send(`${TiCu.Date("log")} : newXPMember\n${tipoui.members.get(entry.id)!.displayName} was added to the XP system`)
    },
    levelChange: function(entry: MemberXPModel, previousLevel: number) {
      maxilog.send(`${TiCu.Date("log")} : levelChange\n${tipoui.members.get(entry.id)!.displayName} changed level from ${previousLevel} to ${entry.level}`)
    },
    statusChange: function(entry: MemberXPModel) {
      maxilog.send(`${TiCu.Date("log")} : XPMemberStatusChange\n${tipoui.members.get(entry.id)!.displayName} is now ${entry.activated ? 'in' : 'out of'} the XP system`)
    },
    error: function(type: string, target: string) {
      switch(type) {
        case TiCu.Xp.errorTypes.AUTOVOTE:
          maxilog.send(`${TiCu.Date("log")} : XP ERROR\nThere was a problem launching the Turquoise auto vote for ${tipoui.members.get(target)!.displayName}`)
          break;
        case TiCu.Xp.errorTypes.NOUPDATE:
          maxilog.send(`${TiCu.Date("log")} : XP ERROR\nThere was a problem updating the XP for ${tipoui.members.get(target)!.displayName} : no entries updated`)
          break;
        case TiCu.Xp.errorTypes.MULTIPLEUPDATE:
          maxilog.send(`${TiCu.Date("log")} : XP ERROR\nThere was a problem updating the XP for ${tipoui.members.get(target)!.displayName} : updated multiple entries`)
          break;
        default:
          maxilog.send(`${TiCu.Date("log")} : XP ERROR\nGeneric error, sorry for the lack of information`)
      }
    }
  }
}
