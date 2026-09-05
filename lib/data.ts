import {AppState,Checkpoint,Team,TeamId} from './types';
export const TEAMS:Team[]=[
{id:'ops',name:'Ban Vận hành',color:'#35c759',icon:'⚙'},
{id:'food',name:'Ban Ẩm thực',color:'#ffd60a',icon:'👨‍🍳'},
{id:'tech',name:'Ban Kỹ thuật',color:'#0a84ff',icon:'🔧'},
{id:'mgmt',name:'Ban do Giám đốc quản lý',color:'#ff453a',icon:'🤝'}];
export const CHECKPOINTS:Checkpoint[]=[
{id:0,name:'CỔNG THỜI GIAN',symbol:'⌁',challenges:0},
{id:1,name:'DẤU ẤN',symbol:'✦',challenges:2},
{id:2,name:'MẬT MÃ',symbol:'◇',challenges:1},
{id:3,name:'LỐI RẼ',symbol:'⟡',challenges:2},
{id:4,name:'NGỌN GIÓ',symbol:'◈',challenges:1},
{id:5,name:'BÍ ẨN',symbol:'✧',challenges:2},
{id:6,name:'CỔNG ÁNH SÁNG',symbol:'◉',challenges:1},
{id:7,name:'ĐÍCH ĐẾN',symbol:'🏆',challenges:2}
];
export const INITIAL:AppState={version:1,teams:{ops:{current:0,completedChallenges:{},completedAt:{}},food:{current:0,completedChallenges:{},completedAt:{}},tech:{current:0,completedChallenges:{},completedAt:{}},mgmt:{current:0,completedChallenges:{},completedAt:{}}}};
export const teamById=(id:TeamId)=>TEAMS.find(t=>t.id===id)!;
