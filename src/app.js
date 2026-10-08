import {calculate} from "./core/calculator.js";
import {loadState,saveState,id} from "./core/storage.js";
let state=loadState(), lastCalculation=null;
const $=s=>document.querySelector(s);
const money=v=>`${Number(v||0).toLocaleString("ar-EG",{maximumFractionDigits:2})} ج.م`;
const num=v=>Number(v||0);
function persist(){saveState(state);renderAll();}
function view(name){document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===name));document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x.dataset.view===name));}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>view(b.dataset.view)));
function table(headers,rows){if(!rows.length)return '<div class="empty">لا توجد بيانات حتى الآن.</div>';return `<div class="tablewrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;}
function renderDashboard(){
 const revenue=state.orders.reduce((s,o)=>s+num(o.price),0), profit=state.orders.reduce((s,o)=>s+num(o.actualProfit ?? (o.price-o.estimatedCost)),0);
 const open=state.orders.filter(o=>!["delivered","cancelled"].includes(o.status)).length;
 const kpis=[["إجمالي مبيعات الطلبات",money(revenue)],["ربح مسجل/تقديري",money(profit)],["طلبات قيد التنفيذ",open],["عدد المنتجات",state.products.length]];
 $("#kpis").innerHTML=kpis.map(([a,b])=>`<div class="kpi"><span>${a}</span><strong>${b}</strong></div>`).join("");
 $("#recentOrders").innerHTML=table(["الطلب","العميل","الحالة","السعر"],state.orders.slice(-5).reverse().map(o=>`<tr><td>${esc(o.name)}</td><td>${esc(o.customer||"—")}</td><td><span class="badge">${esc(o.status)}</span></td><td>${money(o.price)}</td></tr>`));
 const low=state.inventory.filter(i=>num(i.quantity)<=num(i.reorderAt));
 $("#stockAlerts").innerHTML=low.length?table(["الصنف","الكمية","الوحدة"],low.map(i=>`<tr><td>${esc(i.name)}</td><td><span class="badge warn">${i.quantity}</span></td><td>${esc(i.unit)}</td></tr>`)):'<div class="success">لا توجد تنبيهات مخزون حاليًا.</div>';
}
function renderProducts(){ $("#productList").innerHTML=table(["SKU","المنتج","التكلفة","سعر البيع","ربح الوحدة","المخزون",""],state.products.map(p=>`<tr><td>${esc(p.sku||"—")}</td><td>${esc(p.name)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${money(p.price-p.cost)}</td><td>${p.stock}</td><td><button class="btn secondary" data-delete-product="${p.id}">حذف</button></td></tr>`));}
function renderInventory(){ $("#inventoryList").innerHTML=table(["الصنف","النوع","الكمية","الوحدة","حد التنبيه",""],state.inventory.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.type)}</td><td>${i.quantity}</td><td>${esc(i.unit)}</td><td>${i.reorderAt}</td><td><button class="btn secondary" data-delete-inventory="${i.id}">حذف</button></td></tr>`));}
const statuses=["lead","quoted","approved","design","slicing","ready_to_print","printing","qc","post_processing","packed","shipped","delivered","cancelled"];
const statusAr={lead:"عميل محتمل",quoted:"عرض سعر",approved:"موافق عليه",design:"تصميم",slicing:"تجهيز السلايسر",ready_to_print:"جاهز للطباعة",printing:"قيد الطباعة",qc:"فحص الجودة",post_processing:"تشطيب",packed:"معبأ",shipped:"تم الشحن",delivered:"تم التسليم",cancelled:"ملغي"};
function renderOrders(){ $("#orderList").innerHTML=table(["الطلب","العميل","الحالة","السعر","التكلفة المقدرة","الفعل"],state.orders.slice().reverse().map(o=>`<tr><td>${esc(o.name)}<br><small>${o.id}</small></td><td>${esc(o.customer||"—")}</td><td><select data-status="${o.id}">${statuses.map(s=>`<option value="${s}" ${s===o.status?"selected":""}>${statusAr[s]}</option>`).join("")}</select></td><td>${money(o.price)}</td><td>${money(o.estimatedCost)}</td><td><button class="btn secondary" data-actual="${o.id}">تسجيل الفعلي</button> <button class="btn secondary" data-delete-order="${o.id}">حذف</button></td></tr>`));}
function renderAll(){renderDashboard();renderProducts();renderInventory();renderOrders();}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formObj(form){return Object.fromEntries(new FormData(form).entries());}
function renderCalc(r){const metrics=[["الخامة",r.filamentCost],["الكهرباء",r.electricity],["إهلاك الطابعة",r.depreciation],["الصيانة والمستهلكات",r.maintenance],["العمالة",r.labor],["التشطيب",r.post],["التغليف",r.packaging],["الشحن",r.shipping],["التسويق",r.marketing],["الإعداد",r.setup],["مخصص المخاطر/الهالك",r.risk],["التكلفة المعتمدة",r.cost],["الربح قبل الضريبة",r.profit],["هامش الربح",`${r.margin.toFixed(1)}%`],["Markup",`${r.markup.toFixed(1)}%`],["الضريبة/الرسوم",r.tax]];
 $("#calcResult").innerHTML=`<div class="resultbox">${metrics.map(([k,v])=>`<div class="metric"><span>${k}</span><strong>${typeof v==="number"?money(v):v}</strong></div>`).join("")}<div class="pricebox"><span>سعر البيع المقترح شامل الرسوم</span><strong>${money(r.sellingPrice)}</strong><small>المصدر: ${r.source==="gcode"?"G-code/سلايسر":r.source==="stl"?"تقدير STL":"إدخال يدوي"}</small></div>${r.warnings.map(w=>`<div class="warning">${w}</div>`).join("")}</div>`;
}
$("#calcForm").addEventListener("submit",e=>{e.preventDefault();const data=formObj(e.currentTarget);lastCalculation=calculate(data);lastCalculation.input=data;renderCalc(lastCalculation);});
$("#saveQuote").addEventListener("click",()=>{if(!lastCalculation){$("#calcForm").requestSubmit();if(!lastCalculation)return;}state.quotes.push({id:id("quote"),name:lastCalculation.input.name,calculation:lastCalculation,createdAt:new Date().toISOString()});persist();alert("تم حفظ عرض السعر محليًا. لم يتم خصم أي مخزون.");});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const d=formObj(e.currentTarget);state.products.push({id:id("product"),name:d.name,sku:d.sku,cost:num(d.cost),price:num(d.price),stock:num(d.stock)});e.currentTarget.reset();persist();});
$("#inventoryForm").addEventListener("submit",e=>{e.preventDefault();const d=formObj(e.currentTarget);state.inventory.push({id:id("stock"),...d,quantity:num(d.quantity),reorderAt:num(d.reorderAt)});e.currentTarget.reset();persist();});
$("#orderForm").addEventListener("submit",e=>{e.preventDefault();const d=formObj(e.currentTarget);state.orders.push({id:id("order"),...d,price:num(d.price),estimatedCost:num(d.estimatedCost),estimatedGrams:num(d.estimatedGrams),estimatedHours:num(d.estimatedHours),status:"lead",createdAt:new Date().toISOString(),actual:null});e.currentTarget.reset();persist();});
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.deleteProduct){state.products=state.products.filter(x=>x.id!==b.dataset.deleteProduct);persist();}
 if(b.dataset.deleteInventory){state.inventory=state.inventory.filter(x=>x.id!==b.dataset.deleteInventory);persist();}
 if(b.dataset.deleteOrder){if(confirm("حذف الطلب؟")){state.orders=state.orders.filter(x=>x.id!==b.dataset.deleteOrder);persist();}}
 if(b.dataset.actual){const o=state.orders.find(x=>x.id===b.dataset.actual);if(!o)return;const cost=prompt("أدخل التكلفة الفعلية بالجنيه:",o.estimatedCost);if(cost===null)return;const grams=prompt("أدخل وزن الفلمنت الفعلي بالجرام:",o.estimatedGrams);if(grams===null)return;const hours=prompt("أدخل زمن الطباعة الفعلي بالساعات:",o.estimatedHours);if(hours===null)return;o.actual={cost:num(cost),grams:num(grams),hours:num(hours),recordedAt:new Date().toISOString()};o.actualProfit=o.price-o.actual.cost;o.variance={cost:o.actual.cost-o.estimatedCost,grams:o.actual.grams-o.estimatedGrams,hours:o.actual.hours-o.estimatedHours};persist();alert(`فرق التكلفة: ${money(o.variance.cost)}؛ فرق الوزن: ${o.variance.grams} جم؛ فرق الزمن: ${o.variance.hours} ساعة.`);}
});
document.addEventListener("change",e=>{if(e.target.matches("[data-status]")){const o=state.orders.find(x=>x.id===e.target.dataset.status);if(o){o.status=e.target.value;o.updatedAt=new Date().toISOString();persist();}}});
$("#exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`elmalhy3d-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);});
$("#resetBtn").addEventListener("click",()=>{if(confirm("سيتم مسح كل بيانات هذا التطبيق من هذا المتصفح. هل أنت متأكد؟")){localStorage.removeItem("elmalhy3d-business-v2");state=loadState();renderAll();}});
renderAll();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
