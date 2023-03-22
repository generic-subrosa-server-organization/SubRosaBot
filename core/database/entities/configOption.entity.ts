import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class ConfigOption {

    @PrimaryKey()
    id!: string

    @Property()
    value!: any
    
    @Property()
    module!: string

    @Property()
    default!: any
}