export type TeamId='ops'|'food'|'tech'|'mgmt';
export type Team={id:TeamId;name:string;color:string;icon:string};
export type Checkpoint={id:number;name:string;symbol:string;challenges:number};
export type TeamState={current:number;completedChallenges:Record<number,number>;completedAt:Record<number,string>;finishedAt?:string};
export type AppState={version:number;teams:Record<TeamId,TeamState>};
