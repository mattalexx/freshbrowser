export interface Options {
    readonly suffix?: string;
}

export interface Paths {
    readonly data: string;
    readonly config: string;
    readonly cache: string;
    readonly log: string;
    readonly temp: string;
}

export default function envPaths(name: string, options?: Options): Paths
