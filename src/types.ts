import {Channel, GuildMember, Message, MessageReaction, ReactionCollector, RichEmbed, Role, User} from "discord.js"
import { Model } from "sequelize/types"
import {BuildOptions} from "sequelize"

export type Authorization = {
    type: string
    list?: string[]
}

export type AuthorizationsCommand = {
    chans: Authorization
    auths: Authorization
    roles: Authorization
    name: string
    desc: string
    schema: string
    channels: string
    authors: string
    roleNames: string
}

export type AuthorizationsAuto = {
    salons : Authorization
    users : Authorization
}

export type AuthorizationsReactions = {
    messages : Authorization
    salons : Authorization
    users : Authorization
}

export type Command = {
    alias: string[]
    activated: boolean
    authorizations : AuthorizationsCommand,
    run : (params: string[], msg: Message) => void
}

export type VoteCommand = Command & {
    autoTurquoise: (targetId: string, voteNumber: number) => void//so fucking ugly
}

export type AutoCommand = {
    name : string
    desc : string
    schema: string
    trigger: string
    authorizations : AuthorizationsAuto
    run : (msg: Message) => void
}

export type ReactionsCommand = {
    name : string
    desc : string
    emoji: string
    authorizations : AuthorizationsReactions
    run : (reaction: MessageReaction, usr: GuildMember, type: string) => void
}

export type TicuAuthorization = {
    Command : (cmd: string, msg: Message) => boolean
    Reaction : (reactionFunction: ReactionsCommand, reaction: MessageReaction, usr: GuildMember) => boolean
    Auto : (autoCommand: AutoCommand, msg: Message) => boolean
}

export type JsonVote = {
    threshold: number
    type: string
    chan: string
    votes: {
        oui: string[]
        non: string[]
        delai: string[]
        blanc: string[]
    }
}

export type TicuVoteCollection = {
    Init : (type: string, msg: Message) => void
    Startup : () => void
    Collectors : {
        [prop: string]: any
    },
    Collected : (type: string, reaction: MessageReaction, collector: ReactionCollector) => void
    Done : (type: string, reactions: MessageReaction[], reason: string, msg: Message) => void
    CreateEmbedAnon: (target: GuildMember, type: string, threshold: number, voteJson?: JsonVote, result?: string) => RichEmbed
}

export type TicuXp = {
    updateXp: (type: string, value: number, target: string) => void
    updateAllXp: (type: string, value: number) => void
    processXpFromMessage: (type: string, msg: Message) => void
    processXpMessageUpdate: (oldMsg: Message, newMsg: Message) => void
    reactionXp: (type: string, reaction: MessageReaction, usr: User) => void
    getMember: (id: string) => Promise<MemberXPModel>
    getXpByLevel: (level: number) => number
    changeMemberStatus: (target: string, activated: boolean, msg: Message) => void
    resetEveryOneXp: () => void
    errorTypes: {
        AUTOVOTE: string
        MULTIPLEUPDATE: string
        NOUPDATE: string
    }
}

export type Ticu = {
    Date : (type: string) => string
    Log : any
    json : (data: JsonTicu) => any
    Xp : TicuXp
    Mention : (param: string) => Role|Channel|GuildMember|boolean|undefined
    Authorizations : TicuAuthorization
    VotesCollections : TicuVoteCollection
    Categories : any
    Channels : any
    Commands : {
        [prop: string]: Command
        vote: VoteCommand
    }
    Reactions : {
        [prop: string]: ReactionsCommand
    }
    Auto : {
        [prop: string]: AutoCommand
    }
}

export type CategoryPub = {
    id: string
    xpFactor: number
}

export type SalonPub = {
    id: string
    xpFactor: number
}

export type RolePub = {
    id: string,
    xpAddedMultiplicator: number,
    givable: boolean,
    alias: string[]
}

export type Pub = {
    debug: {
        server: string
        minilog: string
        maxilog: string
        bots: string
        botsecret: string
    },
    servers: {
        commu: string
        vigi: string
        debug: string
    },
    categories: {
        [prop: string]: CategoryPub
    },
    users: {
        tipouitaculte: string,
        tentaculte: string,
        electrolune: string,
        pluralkit: string,
        licorne: string,
        xenolune: string
    },
    salons: {
        [prop: string]: SalonPub
    },
    roles: {
        [prop: string]: RolePub
    }
}

export interface MemberXPModel extends Model {
    id: string
    xp: number
    level: number
    activated: boolean
}

export type MemberXPModelStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): MemberXPModel;
}

export type JsonTicu = {
    action :string
    target?: string
    content?: any
}