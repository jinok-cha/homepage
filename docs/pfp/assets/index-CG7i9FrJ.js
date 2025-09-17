import{render as de}from"https://esm.sh/preact@10.22.1";import{useState as P,useEffect as ue,useMemo as D}from"https://esm.sh/preact@10.22.1/hooks";import{html as $}from"https://esm.sh/htm@3.1.1/preact";import pe from"https://esm.sh/jspdf@2.5.1";import me from"https://esm.sh/html2canvas@1.4.1";(function(){const E=document.createElement("link").relList;if(E&&E.supports&&E.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))w(c);new MutationObserver(c=>{for(const v of c)if(v.type==="childList")for(const F of v.addedNodes)F.tagName==="LINK"&&F.rel==="modulepreload"&&w(F)}).observe(document,{childList:!0,subtree:!0});function r(c){const v={};return c.integrity&&(v.integrity=c.integrity),c.referrerPolicy&&(v.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?v.credentials="include":c.crossOrigin==="anonymous"?v.credentials="omit":v.credentials="same-origin",v}function w(c){if(c.ep)return;c.ep=!0;const v=r(c);fetch(c.href,v)}})();const j=["#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff","#f0e68c","#ffdab9","#e6e6fa","#b0e0e6","#d8bfd8","#c1e1c1","#f5e3e6","#e2d2f2"],ge=()=>{const[m,E]=P({inflationRate:2.5,educationInflationRate:6,loanInterestRate:3.8,expectedReturnRate:3,postRetirementInflationRate:2,postRetirementExpectedReturnRate:2.5}),[r,w]=P({clientAge:27,spouseAge:25,clientIncome:300,spouseIncome:250,clientPension:80,spousePension:70,clientRetirementAge:60,spouseRetirementAge:57,clientLifeExpectancy:90,spouseLifeExpectancy:90,clientSalaryIncreaseRate:3,spouseSalaryIncreaseRate:2.5,children:[{age:-4}]}),[c,v]=P([{id:1,name:"결혼자금",timing:3,requiredFunds:3e3,currentSavings:0,savingStart:0,savingPeriod:3},{id:2,name:"전세자금",timing:3,requiredFunds:3e3,currentSavings:0,savingStart:0,savingPeriod:3},{id:3,name:"전세자금이자",timing:3,requiredFunds:2e4,currentSavings:0,savingStart:3,savingPeriod:8},{id:4,name:"주택마련",timing:11,requiredFunds:2e4,currentSavings:0,savingStart:3,savingPeriod:8},{id:5,name:"대출상환",timing:11,requiredFunds:2e4,currentSavings:0,savingStart:11,savingPeriod:20},{id:6,name:"첫째대학",timing:24,requiredFunds:5e3,currentSavings:0,savingStart:11,savingPeriod:13},{id:7,name:"둘째대학",timing:26,requiredFunds:5e3,currentSavings:0,savingStart:11,savingPeriod:15},{id:8,name:"첫째결혼",timing:34,requiredFunds:1e4,currentSavings:0,savingStart:24,savingPeriod:10},{id:9,name:"둘째결혼",timing:36,requiredFunds:1e4,currentSavings:0,savingStart:26,savingPeriod:10},{id:10,name:"은퇴자금",timing:33,requiredFunds:100,currentSavings:0,savingStart:24,savingPeriod:11},{id:11,name:"은퇴자금2",timing:33,requiredFunds:100,currentSavings:0,savingStart:24,savingPeriod:11}]),[F,N]=P(null),[C,L]=P(null),[J,M]=P(null),[T,Y]=P([!1,!1,!1]),[G,_]=P([null,null,null]),[k,V]=P(!1);ue(()=>{const e=[],t=[];[1,2,3].forEach(n=>{const s=localStorage.getItem(`financialPlan_${n}`);if(s){e.push(!0);try{const l=JSON.parse(s);typeof l.totalSavingsPrincipal=="number"?t.push(l.totalSavingsPrincipal):t.push(null)}catch{t.push(null)}}else e.push(!1),t.push(null)}),Y(e),_(t)},[]);const O=D(()=>{const e=new Set;return r.children.forEach(t=>{if(t.age<0){const n=-t.age+1;e.add(n)}}),e},[r.children]),B=D(()=>{const e=(s,l,u,y,g)=>{const f=Math.max(0,l-s),p=y/100;let a=0;for(let i=0;i<f;i++){const o=i+1;let d;g.has(o)?d=2280:d=u*12*Math.pow(1+p,i),a+=d}return a},t=e(r.clientAge,r.clientRetirementAge,r.clientIncome,r.clientSalaryIncreaseRate,new Set),n=e(r.spouseAge,r.spouseRetirementAge,r.spouseIncome,r.spouseSalaryIncreaseRate,O);return{client:t,spouse:n}},[r,O]),q=(e,t)=>{E(n=>({...n,[e]:parseFloat(t)||0}))},I=(e,t)=>{w(n=>({...n,[e]:parseFloat(t)||0}))},z=()=>{w(e=>({...e,children:[...e.children,{age:0}]}))},K=e=>{w(t=>({...t,children:t.children.filter((n,s)=>s!==e)}))},X=(e,t)=>{const n=[...r.children];n[e]={age:parseInt(t,10)||0},w(s=>({...s,children:n}))},U=()=>{v([...c,{id:Date.now(),name:"",timing:0,requiredFunds:0,currentSavings:0,savingStart:0,savingPeriod:0}])},Q=e=>{v(c.filter(t=>t.id!==e))},A=(e,t,n)=>{v(c.map(s=>{if(s.id!==e)return s;if(typeof n=="string"&&t!=="name"){const l=n.replace(/,/g,""),u=parseFloat(l);return t==="lumpSumReturnRate"||t==="periodicReturnRate"?{...s,[t]:isNaN(u)?void 0:u}:{...s,[t]:isNaN(u)?0:u}}return{...s,[t]:n}}))},R=e=>isNaN(e)||!isFinite(e)?"0":Math.round(e).toLocaleString("ko-KR"),Z=(e,t)=>{L(t),e.dataTransfer.setData("text/plain",t.toString()),e.dataTransfer.effectAllowed="move"},ee=(e,t)=>{e.preventDefault(),t!==C&&M(t)},te=e=>{e.preventDefault()},ne=(e,t)=>{if(e.preventDefault(),C===null||C===t){M(null),L(null);return}const n=c.findIndex(y=>y.id===C),s=c.findIndex(y=>y.id===t);if(n===-1||s===-1)return;const l=[...c],[u]=l.splice(n,1);l.splice(s,0,u),v(l),L(null),M(null)},ae=()=>{L(null),M(null)},re=e=>{const t=S.reduce((u,y)=>{const g=(y.savingPeriod||0)*(y.monthlyPayment||0)*12;return u+g},0),n={personalInfo:r,economicAssumptions:m,goals:c,totalSavingsPrincipal:t};localStorage.setItem(`financialPlan_${e+1}`,JSON.stringify(n));const s=[...T];s[e]=!0,Y(s);const l=[...G];l[e]=t,_(l),alert(`플랜 ${e+1}이(가) 저장되었습니다.`)},ie=e=>{const t=localStorage.getItem(`financialPlan_${e+1}`);if(t)try{const n=JSON.parse(t);n.personalInfo&&n.economicAssumptions&&n.goals?(w(n.personalInfo),E(n.economicAssumptions),v(n.goals),alert(`플랜 ${e+1}을(를) 복구했습니다.`)):alert("저장된 데이터 형식이 올바르지 않습니다.")}catch(n){console.error("Failed to parse plan data:",n),alert("데이터를 복구하는 중 오류가 발생했습니다.")}},se=async()=>{V(!0),document.body.classList.add("pdf-generating");const e=document.querySelector(".pdf-btn");try{e&&e.classList.add("hide-for-pdf"),await new Promise(b=>setTimeout(b,50));const t=document.getElementById("app-container");if(!t)throw new Error("App container element not found for PDF generation.");const n=await me(t,{scale:2,useCORS:!0,logging:!1}),s=n.toDataURL("image/png"),l=n.width,u=n.height,y=l>u?"l":"p",g=new pe(y,"mm","a4"),f=g.internal.pageSize.getWidth(),p=g.internal.pageSize.getHeight(),a=l/u,i=f/a;let o=i,d=0;for(g.addImage(s,"PNG",0,d,f,i),o-=p;o>0;)d-=p,g.addPage(),g.addImage(s,"PNG",0,d,f,i),o-=p;g.save("financial_plan.pdf")}catch(t){console.error("Error generating PDF:",t),alert("PDF를 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.")}finally{e&&e.classList.remove("hide-for-pdf"),document.body.classList.remove("pdf-generating"),V(!1)}},S=D(()=>c.map(e=>{const t={...e};for(const p in t)typeof t[p]=="number"&&(t[p]=t[p]||0);const n=(t.lumpSumReturnRate??m.expectedReturnRate)/100,s=(t.periodicReturnRate??m.expectedReturnRate)/100;let l;if(t.name.includes("전세자금이자"))l=t.requiredFunds;else if(t.name.includes("은퇴")){const a=t.requiredFunds*12,i=m.inflationRate/100,o=a*Math.pow(1+i,t.timing),d=Math.max(0,r.clientLifeExpectancy-r.clientRetirementAge),b=m.postRetirementExpectedReturnRate/100,h=m.postRetirementInflationRate/100,x=d;b<=h?l=o*x:l=o*(1-Math.pow((1+h)/(1+b),x))/(b-h)}else if(t.name.includes("대출상환"))l=t.requiredFunds;else{let p=m.inflationRate/100;t.name.includes("대학")&&(p=m.educationInflationRate/100),l=t.requiredFunds*Math.pow(1+p,t.timing)}const u=t.currentSavings*Math.pow(1+n,t.timing),y=Math.max(0,l-u);let g=0;const f=t.timing-t.savingStart-t.savingPeriod;if(t.name.includes("전세자금이자"))g=t.requiredFunds*(m.loanInterestRate/100)/12;else if(t.name.includes("대출상환")){const p=t.requiredFunds,a=m.loanInterestRate/100/12,i=t.savingPeriod*12;if(i>0&&a>0){const o=Math.pow(1+a,i);g=p*(a*o)/(o-1)}else i>0&&(g=p/i)}else{const p=y/Math.pow(1+n,f),a=s/12,i=t.savingPeriod*12;i>0&&(a>0?g=p*(a/(Math.pow(1+a,i)-1)):g=p/i)}return{...t,futureValueRequired:l,futureValueCurrent:u,shortfall:y,monthlyPayment:g,holdingPeriod:f}}),[c,m,r]),H=D(()=>S.reduce((e,t)=>(e.currentSavings+=t.currentSavings,t.savingStart===0&&(e.monthlyPayment+=t.monthlyPayment),e),{currentSavings:0,monthlyPayment:0}),[S]),oe=()=>{if(S.length===0)return null;const e=Math.max(...S.map(a=>(a.savingStart||0)+(a.savingPeriod||0)),...S.map(a=>a.timing||0),0);if(e===0)return $`<p>그래프를 표시하려면 목표 시기를 입력하세요.</p>`;const t=Array.from({length:e},(a,i)=>({year:i+1,total:0,goals:{}})),n=new Map;S.forEach((a,i)=>{n.set(a.id,j[i%j.length])}),S.forEach((a,i)=>{const o=a.savingStart||0,d=o+a.savingPeriod,b=n.get(a.id);for(let h=o;h<d;h++)t[h]&&(t[h].total+=a.monthlyPayment,t[h].goals[a.id]||(t[h].goals[a.id]={name:a.name||`목표 ${i+1}`,payment:0,color:b}),t[h].goals[a.id].payment+=a.monthlyPayment)});const s=S.find(a=>a.name.includes("결혼자금")),l=s?s.timing:0,u=Array.from({length:e},(a,i)=>{const o=i+1;let d=0;r.clientAge+o<=r.clientRetirementAge&&(d=r.clientIncome*Math.pow(1+r.clientSalaryIncreaseRate/100,i));let b=0;return o>l&&r.spouseAge+o<=r.spouseRetirementAge&&(O.has(o)?b=190:b=r.spouseIncome*Math.pow(1+r.spouseSalaryIncreaseRate/100,i)),d+b}),y=Math.max(...t.map(a=>a.total),0),g=Math.max(...u,0),f=Math.max(y,g),p=u.map((a,i)=>{const o=(i+.5)/e*100,d=100-(f>0?a/f*100:0);return`${o},${d}`}).join(" ");return f===0?$`<p>월 필요적립금 또는 소득이 계산되면 그래프가 표시됩니다.</p>`:$`
        <div class="chart-container">
            <div class="chart-legend">
                ${S.map(a=>$`<div key=${a.id} class="legend-item">
                        <span class="legend-color" style=${{backgroundColor:n.get(a.id)}}></span>
                        ${a.name}
                    </div>`)}
                <div class="legend-item">
                    <span class="legend-line"></span>
                    부부 합산 월소득
                </div>
            </div>
            <div class="chart">
                <div class="bars-container">
                    <div class="bars" onClick=${()=>N(null)}>
                        ${t.map((a,i)=>{const o=100/e,d={left:`${i*o}%`,width:`${o}%`};return $`<div key=${a.year} class="bar-wrapper" style=${d}>
                                ${a.total>0&&$`<span class="bar-value" style=${{bottom:`${a.total/f*100}%`}}>${R(a.total)}</span>`}
                                <div class="bar" style=${{height:f>0?`${a.total/f*100}%`:"0%"}}>
                                    ${Object.entries(a.goals).map(([b,h])=>{const x=parseInt(b,10),W=a.total>0?h.payment/a.total*100:0;return $`<div 
                                                key=${x}
                                                class=${`bar-segment ${F!==null&&F!==x?"dimmed":""}`}
                                                style=${{height:`${W}%`,backgroundColor:h.color}}
                                                title=${`${h.name}: ${R(h.payment)}`}
                                                onClick=${le=>{le.stopPropagation(),N(ce=>ce===x?null:x)}}
                                            ></div>`})}
                                </div>
                                <span class="x-axis-label">${a.year}년</span>
                            </div>`})}
                    </div>
                    <div class="line-chart-wrapper">
                        <svg class="line-chart-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <polyline points=${p} />
                            ${u.map((a,i)=>{if(a<=0)return null;const o=(i+.5)/e*100,d=100-(f>0?a/f*100:0);return $`<g key=${`marker-group-${i}`} class="marker-group">
                                      <ellipse class="marker" cx=${o} cy=${d} rx="0.53" ry="0.8" />
                                    </g>`})}
                        </svg>
                        ${u.map((a,i)=>{if(a<=0)return null;const o=(i+.5)/e*100,d=f>0?a/f*100:0,b={left:`${o}%`,bottom:`${d}%`};return $`<span class="line-chart-label-html" style=${b}>${R(a)}</span>`})}
                    </div>
                </div>
            </div>
        </div>`};return $`
    ${k&&$`
        <div class="pdf-loader-overlay">
            <div class="loader-content">
                <div class="spinner"></div>
                <p>PDF 저장 중...</p>
            </div>
        </div>
    `}
    <div class="container" id="app-container" aria-labelledby="app-title">
      <main>
        <section class="settings" aria-labelledby="economic-assumptions-title">
          <div class="section-header">
            <h2 id="economic-assumptions-title">기본정보</h2>
            <button class="pdf-btn" onClick=${se} disabled=${k}>
              ${k?"저장 중...":"PDF로 저장"}
            </button>
          </div>
          <div class="settings-grid">
            <div class="form-group">
              <label for="inflation-rate">물가상승률 (%)</label>
              <input type="number" id="inflation-rate" value=${m.inflationRate} onInput=${e=>q("inflationRate",e.target.value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="education-inflation-rate">교육비상승률 (%)</label>
              <input type="number" id="education-inflation-rate" value=${m.educationInflationRate} onInput=${e=>q("educationInflationRate",e.target.value)} step="0.1" />
            </div>
             <div class="form-group">
              <label for="loan-interest-rate">대출이율 (%)</label>
              <input type="number" id="loan-interest-rate" value=${m.loanInterestRate} onInput=${e=>q("loanInterestRate",e.target.value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="expected-return-rate">기대수익률 (%)</label>
              <input type="number" id="expected-return-rate" value=${m.expectedReturnRate} onInput=${e=>q("expectedReturnRate",e.target.value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="post-retirement-inflation-rate">은퇴후물가상승률 (%)</label>
              <input type="number" id="post-retirement-inflation-rate" value=${m.postRetirementInflationRate} onInput=${e=>q("postRetirementInflationRate",e.target.value)} step="0.1" />
            </div>
            <div class="form-group">
              <label for="post-retirement-expected-return-rate">은퇴후기대수익률 (%)</label>
              <input type="number" id="post-retirement-expected-return-rate" value=${m.postRetirementExpectedReturnRate} onInput=${e=>q("postRetirementExpectedReturnRate",e.target.value)} step="0.1" />
            </div>
          </div>
        </section>

        <section class="settings" aria-labelledby="personal-info-title">
          <div class="table-wrapper">
            <table class="personal-info-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>나이</th>
                  <th>월소득</th>
                  <th>국민연금예상</th>
                  <th>은퇴시점</th>
                  <th>기대여명</th>
                  <th>급여상승률(%)</th>
                  <th>예상총소득</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>고객</td>
                  <td><input type="number" value=${r.clientAge} onInput=${e=>I("clientAge",e.target.value)} /></td>
                  <td><input type="number" value=${r.clientIncome} onInput=${e=>I("clientIncome",e.target.value)} /></td>
                  <td><input type="number" value=${r.clientPension} onInput=${e=>I("clientPension",e.target.value)} /></td>
                  <td><input type="number" value=${r.clientRetirementAge} onInput=${e=>I("clientRetirementAge",e.target.value)} /></td>
                  <td><input type="number" value=${r.clientLifeExpectancy} onInput=${e=>I("clientLifeExpectancy",e.target.value)} /></td>
                  <td><input type="number" value=${r.clientSalaryIncreaseRate} onInput=${e=>I("clientSalaryIncreaseRate",e.target.value)} step="0.1" /></td>
                  <td>${R(B.client)}</td>
                </tr>
                 <tr>
                  <td>배우자</td>
                  <td><input type="number" value=${r.spouseAge} onInput=${e=>I("spouseAge",e.target.value)} /></td>
                  <td><input type="number" value=${r.spouseIncome} onInput=${e=>I("spouseIncome",e.target.value)} /></td>
                  <td><input type="number" value=${r.spousePension} onInput=${e=>I("spousePension",e.target.value)} /></td>
                  <td><input type="number" value=${r.spouseRetirementAge} onInput=${e=>I("spouseRetirementAge",e.target.value)} /></td>
                  <td><input type="number" value=${r.spouseLifeExpectancy} onInput=${e=>I("spouseLifeExpectancy",e.target.value)} /></td>
                  <td><input type="number" value=${r.spouseSalaryIncreaseRate} onInput=${e=>I("spouseSalaryIncreaseRate",e.target.value)} step="0.1" /></td>
                  <td>${R(B.spouse)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="children-info">
            ${r.children.map((e,t)=>$`<div key=${t} class="form-group child-group">
                <label for=${`child${t}-age`}>자녀${t+1}</label>
                <input
                  type="number"
                  id=${`child${t}-age`}
                  value=${e.age}
                  onInput=${n=>X(t,n.target.value)}
                />
                <button onClick=${()=>K(t)} class="remove-btn-small" aria-label=${`자녀 ${t+1} 삭제`}>X</button>
              </div>`)}
            <button onClick=${z} class="add-btn-small">+ 자녀 추가</button>
          </div>
        </section>

        <section class="goals-table" aria-labelledby="goals-title">
           <div class="section-header">
             <h2 id="goals-title">재무 목표 입력</h2>
             <button onClick=${U} class="add-btn">+ 목표 추가</button>
           </div>
          <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>재무목표</th>
                    <th>시기</th>
                    <th>필요자금</th>
                    <th>기필요자금</th>
                    <th>현재준비</th>
                    <th>기준비자금</th>
                    <th>필요차액</th>
                    <th>저축시작</th>
                    <th>저축기간</th>
                    <th>월적립금</th>
                    <th>거치기간</th>
                    <th>거치수익률</th>
                    <th>적립수익률</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  ${S.map((e,t)=>$`<tr 
                      key=${e.id}
                      draggable=${!0}
                      onDragStart=${n=>Z(n,e.id)}
                      onDragEnter=${n=>ee(n,e.id)}
                      onDragOver=${te}
                      onDrop=${n=>ne(n,e.id)}
                      onDragEnd=${ae}
                      class=${`${e.id===F?"highlighted-row":""} ${e.id===C?"dragging":""} ${e.id===J?"drag-over":""}`}
                    >
                      <td><input type="text" value=${e.name} onInput=${n=>A(e.id,"name",n.target.value)} placeholder=${`목표 ${t+1}`} /></td>
                      <td><input type="number" value=${e.timing} onInput=${n=>A(e.id,"timing",n.target.value)} step="1" /></td>
                      <td><input type="number" value=${e.requiredFunds} onInput=${n=>A(e.id,"requiredFunds",n.target.value)} step=${e.name.includes("은퇴")?10:1e3} /></td>
                      <td>${R(e.futureValueRequired)}</td>
                      <td><input type="number" value=${e.currentSavings} onInput=${n=>A(e.id,"currentSavings",n.target.value)} step="1000" disabled=${e.name.includes("전세자금이자")} /></td>
                      <td>${R(e.futureValueCurrent)}</td>
                      <td>${R(e.shortfall)}</td>
                      <td><input type="number" value=${e.savingStart} onInput=${n=>A(e.id,"savingStart",n.target.value)} step="1" /></td>
                      <td><input type="number" value=${e.savingPeriod} onInput=${n=>A(e.id,"savingPeriod",n.target.value)} step="1" /></td>
                      <td class="highlight">${R(e.monthlyPayment)}</td>
                      <td>${R(e.holdingPeriod)}</td>
                      <td><input type="number" step="0.1" value=${e.lumpSumReturnRate??m.expectedReturnRate} onInput=${n=>A(e.id,"lumpSumReturnRate",n.target.value)} disabled=${e.name.includes("대출상환")||e.name.includes("전세자금이자")} /></td>
                      <td><input type="number" step="0.1" value=${e.periodicReturnRate??m.expectedReturnRate} onInput=${n=>A(e.id,"periodicReturnRate",n.target.value)} disabled=${e.name.includes("대출상환")||e.name.includes("전세자금이자")} /></td>
                      <td><button onClick=${()=>Q(e.id)} class="remove-btn" aria-label=${`${e.name} 목표 삭제`}>X</button></td>
                    </tr>`)}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan=${4}><strong>합계</strong></td>
                        <td><strong>${R(H.currentSavings)}</strong></td>
                        <td>-</td>
                        <td>-</td>
                        <td colSpan=${2}>-</td>
                        <td class="highlight"><strong>${R(H.monthlyPayment)}</strong></td>
                        <td colSpan=${4}></td>
                    </tr>
                </tfoot>
              </table>
          </div>
        </section>

        <section class="plan-management" aria-label="플랜 관리">
          <div class="plan-slots">
            ${[0,1,2].map(e=>$`<div key=${e} class="plan-slot">
                <span class="plan-label">플랜 ${e+1}</span>
                <button onClick=${()=>re(e)}>저장</button>
                <button onClick=${()=>ie(e)} disabled=${!T[e]}>복구</button>
                ${G[e]!==null&&$`<span class="plan-total-savings">
                    총저축 원금: ${R(G[e])}
                  </span>`}
              </div>`)}
          </div>
        </section>

        <section class="results" aria-labelledby="chart-title">
            <h2 id="chart-title">분석 그래프</h2>
            ${oe()}
        </section>

      </main>
    </div>
  `};de($`<${ge} />`,document.getElementById("root"));
