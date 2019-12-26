import {Pub} from "../types"

declare const PUB: Pub

export = {
  findById: function (id: string) {
    return Object.values(PUB.salons).find(v => v.id === id)
  }
}