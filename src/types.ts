import { Message } from "discord.js"

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

export type Command = {
    alias: string[]
    activated: boolean
    authorizations : AuthorizationsCommand,
    run : (params: string[], msg: Message) => void
}

export type Ticu = {
    Date : any
    Log : any
    json : any
    Xp : any
    Mention : any
    Authorizations : any
    VotesCollections : any
    Categories : any
    Channels : any
    Commands : {
        [prop: string]: Command
    }
    Reactions : any
    Auto : any
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

export type MemberXPType = {
    id: string
    xp: number
    level: number
    activated: boolean
}

export type JsonTicu = {
    action :string
    target?: string
    content?: any
}