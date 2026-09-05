import {AppState,Checkpoint,Team,TeamId,TeamState} from './types';

// Danh sách đội chơi và checkpoint giữ nguyên như dữ liệu gốc của dự án — không tự ý đổi/thêm tên mới.
export const TEAMS:Team[]=[
{id:'ops',name:'Ban Vận hành',color:'#35c759',icon:'⚙'},
{id:'food',name:'Ban Ẩm thực',color:'#ffd60a',icon:'👨‍🍳'},
{id:'tech',name:'Ban Kỹ thuật',color:'#0a84ff',icon:'🔧'},
{id:'mgmt',name:'Ban do Giám đốc quản lý',color:'#ff453a',icon:'🤝'}];

export const CHECKPOINTS:Checkpoint[]=[
{id:0,name:'CỔNG THỜI GIAN',symbol:'⌁',challenges:0},
{id:1,name:'CHECK POINT 2',symbol:'2',challenges:2},
{id:2,name:'CHECK POINT 3',symbol:'3',challenges:2},
{id:3,name:'CHECK POINT 4',symbol:'4',challenges:2},
{id:4,name:'CHECK POINT 5',symbol:'5',challenges:2},
{id:5,name:'CHECK POINT 6',symbol:'6',challenges:2},
{id:6,name:'CHECK POINT 7',symbol:'7',challenges:2},
{id:7,name:'CHECK POINT 8',symbol:'8',challenges:2},
{id:8,name:'CHECK POINT 9',symbol:'9',challenges:2},
{id:9,name:'ĐÍCH ĐẾN',symbol:'🏆',challenges:2}
];

const emptyTeamState=():TeamState=>({current:0,challengesDone:{},completedAt:{}});

export const INITIAL:AppState={
  version:2,
  teams:{
    ops:emptyTeamState(),
    food:emptyTeamState(),
    tech:emptyTeamState(),
    mgmt:emptyTeamState()
  }
};

export const teamById=(id:TeamId)=>TEAMS.find(t=>t.id===id)!;
