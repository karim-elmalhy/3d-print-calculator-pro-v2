const KEY="elmalhy3d-business-v2";
const defaults={products:[],inventory:[],orders:[],quotes:[],version:"2.0.0"};
export function loadState(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")};}catch{return structuredClone(defaults);}}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
export function id(prefix="id"){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
