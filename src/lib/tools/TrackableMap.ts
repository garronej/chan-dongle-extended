import { SyncEvent } from "ts-events-extended";

export class TrackableMap<K,V>{

    private readonly map= new Map<K,V>();

    public readonly evtSet= new SyncEvent<K>();
    public readonly evtDelete= new SyncEvent<K>();

    public get(key: K): V | undefined{
        return this.map.get(key);
    }

    public has(key: K): boolean {
        return this.map.has(key);
    }


    public set(key: K, value: V): this{

        this.map.set(key, value);

        this.evtSet.post(key);

        return this;

    }

    public delete(key: K): boolean {

        let hasBeenDeleted= this.map.delete(key);

        if( hasBeenDeleted )
            this.evtDelete.post(key);

        return hasBeenDeleted;
    }

    public keysAsArray(): K[] {

        let out: K[]= [];

        this.map.forEach( (_, key)=> out.push(key));

        return out;

    }

    public toObject(): { [key: string]: V } {

        let out= {};

        for( let key of this.keysAsArray())
            out[key.toString()]= this.map.get(key);

        return out;

    }

}