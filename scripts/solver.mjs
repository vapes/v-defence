/**
 * Level solver — finds tower strategy for each level, writes solution to JSON.
 * Usage: node scripts/solver.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = join(__dirname, '../src/data/levels');
const CELL_SIZE = 64;
const SIM_DT = 30;

// ── Configs ──────────────────────────────────────────────────────────────────

const TOWER = {
  bullet:    { levels:[{cost:100,damage:20,fireRate:900,range:120},
                        {cost:180,damage:45,fireRate:750,range:150},
                        {cost:300,damage:100,fireRate:600,range:180}] },
  laser:     { levels:[{cost:150,baseDmg:10,maxDmg:25, range:100},
                        {cost:250,baseDmg:20,maxDmg:65, range:120},
                        {cost:450,baseDmg:40,maxDmg:180,range:140}] },
  mortar:    { levels:[{cost:120,damage:30,fireRate:2500,range:200,aoe:40},
                        {cost:200,damage:60,fireRate:2000,range:220,aoe:60},
                        {cost:450,damage:150,fireRate:2000,range:250,aoe:100}] },
  cryo:      { levels:[{cost:80, damage:2, fireRate:500, range:100,slow:0.2},
                        {cost:120,damage:5, fireRate:500, range:110,slow:0.4},
                        {cost:300,damage:10,fireRate:500, range:130,slow:0.6}] },
  alchemist: { levels:[{cost:150,dotDps:5, dotDur:3,range:110,fireRate:1000},
                        {cost:250,dotDps:15,dotDur:5,range:130,fireRate:1000},
                        {cost:500,dotDps:40,dotDur:7,range:150,fireRate:1000,shred:0.5}] },
  gold_mine: { levels:[{cost:200,income:20,interval:10000},
                        {cost:300,income:60,interval:10000},
                        {cost:600,income:150,interval:10000}] },
  tesla:     { levels:[{cost:180,damage:15,chain:3,range:100,fireRate:1000},
                        {cost:250,damage:30,chain:5,range:120,fireRate:1000},
                        {cost:500,damage:60,chain:8,range:140,fireRate:1000}] },
  void_beacon:{levels:[{cost:250,range:150},{cost:350,range:170},{cost:600,range:200}]},
  oracle:    { levels:[{cost:150,aura:150},{cost:200,aura:180},{cost:450,aura:200}]},
  orbital:   { levels:[{cost:400,damage:200,cooldown:8000,range:99999},
                        {cost:500,damage:500,cooldown:6000,range:99999},
                        {cost:1000,damage:1500,cooldown:5000,range:99999,ignoreArmor:true}]},
};

const ENEMY = {
  circle:   {hp:60,  speed:1.5,reward:10, armor:0 },
  triangle: {hp:40,  speed:2.0,reward:12, armor:0 },
  hexagon:  {hp:300, speed:0.8,reward:40, armor:5 },
  square:   {hp:150, speed:1.2,reward:25, armor:25},
  pentagon: {hp:2500,speed:0.6,reward:200,armor:30},
};

const PASSIVE = new Set(['oracle','void_beacon','gold_mine']);
const W = (r,c) => ({x:c*CELL_SIZE+CELL_SIZE/2, y:r*CELL_SIZE+CELL_SIZE/2});
const D = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);

// ── Grid ──────────────────────────────────────────────────────────────────────

function bfsPath(grid) {
  const rows=grid.length, cols=grid[0].length;
  let S=null,E=null;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    if(grid[r][c]===2)S=[r,c]; if(grid[r][c]===3)E=[r,c];
  }
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  const vis=grid.map(r=>r.map(()=>false));
  const par=grid.map(r=>r.map(()=>null));
  const q=[S]; vis[S[0]][S[1]]=true;
  while(q.length){
    const [r,c]=q.shift();
    if(r===E[0]&&c===E[1])break;
    for(const [dr,dc] of DIRS){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!vis[nr][nc]&&grid[nr][nc]!==0){
        vis[nr][nc]=true; par[nr][nc]=[r,c]; q.push([nr,nc]);
      }
    }
  }
  const path=[]; let cur=E;
  while(cur){path.unshift(cur);cur=par[cur[0]][cur[1]];}
  return path;
}

function adjacentGrass(grid, pathSet) {
  const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
  const rows=grid.length, cols=grid[0].length;
  const out=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    if(grid[r][c]!==0) continue;
    if(DIRS.some(([dr,dc])=>pathSet.has(`${r+dr},${c+dc}`))) out.push([r,c]);
  }
  return out;
}

function coverage(r,c,path,range){
  const w=W(r,c);
  return path.filter(([pr,pc])=>D(w,W(pr,pc))<=range).length;
}

function posOnPath(progress,pw){
  const len=(pw.length-1)*CELL_SIZE;
  progress=Math.min(Math.max(progress,0),len);
  const seg=Math.min(Math.floor(progress/CELL_SIZE),pw.length-2);
  const t=(progress%CELL_SIZE)/CELL_SIZE;
  const a=pw[seg],b=pw[seg+1];
  return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function towerEffDps(type, level, armor){
  const s=TOWER[type].levels[level];
  if(type==='laser')     return Math.max(0,(s.baseDmg+s.maxDmg)/2-armor);
  if(type==='mortar')    return Math.max(0,s.damage-armor)*2; // AoE
  if(type==='tesla')     return Math.max(0,s.damage-armor)*Math.min(s.chain,4)/((s.fireRate||1000)/1000);
  if(type==='alchemist') return Math.max(0,s.dotDps-armor);
  if(type==='cryo')      return 0.5;
  if(type==='orbital')   return Math.max(0,s.ignoreArmor?s.damage:(s.damage-armor))/((s.cooldown||8000)/1000);
  if(type==='gold_mine') return 0;
  return Math.max(0,(s.damage||0)-armor)/((s.fireRate||1000)/1000);
}

/** Score for placing a tower: coverage × dps / cost */
function placeScore(r,c,type,level,path,armor){
  const s=TOWER[type].levels[level];
  const cov=coverage(r,c,path,s.range||120);
  return cov*towerEffDps(type,level,armor)/(s.cost);
}

// ── Spending ──────────────────────────────────────────────────────────────────

/**
 * Spend money greedily on upgrades and/or new towers.
 * upgradeOnly=true: only upgrade existing towers (no new placements).
 * armorForPlacement: armor value for placement scoring (use 0 for early game).
 * armorForUpgrade: armor value for upgrade scoring (use max for late game).
 */
function greedySpend(money, towers, occupied, validPos, available, path,
                     armorForPlacement, armorForUpgrade, upgradeOnly, actions, tag) {
  let changed = true;
  while(changed && money > 0){
    changed = false;

    // Best upgrade
    let bestUpg=null, bestUS=-1;
    for(const t of towers){
      const cfg=TOWER[t.type];
      if(t.level>=cfg.levels.length-1) continue;
      const upgCost=cfg.levels[t.level+1].cost;
      if(upgCost>money) continue;
      const sc=placeScore(t.row,t.col,t.type,t.level+1,path,armorForUpgrade);
      if(sc>bestUS){bestUS=sc;bestUpg={t,upgCost};}
    }

    // Best new placement (skip if upgradeOnly)
    let bestNew=null, bestNS=-1;
    if(!upgradeOnly){
      for(const [r,c] of validPos){
        if(occupied.has(`${r},${c}`)) continue;
        for(const type of available){
          if(PASSIVE.has(type)) continue;
          const s0=TOWER[type].levels[0];
          if(!s0||s0.cost>money) continue;
          const sc=placeScore(r,c,type,0,path,armorForPlacement);
          if(sc>bestNS){bestNS=sc;bestNew={r,c,type,cost:s0.cost};}
        }
      }
    }

    // Pick best option; upgrades beat placements when scores are close
    const pickUpg = bestUpg && (!bestNew || bestUS >= bestNS * 0.7);
    if(pickUpg){
      money-=bestUpg.upgCost;
      bestUpg.t.level++;
      actions.push({action:'upgrade',type:bestUpg.t.type,row:bestUpg.t.row,col:bestUpg.t.col,when:tag});
      changed=true;
    } else if(bestNew){
      money-=bestNew.cost;
      occupied.add(`${bestNew.r},${bestNew.c}`);
      towers.push({type:bestNew.type,row:bestNew.r,col:bestNew.c,level:0});
      actions.push({action:'place',type:bestNew.type,row:bestNew.r,col:bestNew.c,when:tag});
      changed=true;
    }
  }
  return money;
}

// ── Wave simulation ───────────────────────────────────────────────────────────

function simulateWave(waveCfg, wi, towers, occupied, validPos, available, path,
                      pathWorld, totalLen, actions, startMoney,
                      armorP, armorU, upgradeOnly) {
  const hpMult=1+wi*0.15;
  const SPPMS=60/1000; // speed-px-per-ms factor

  const schedule=[];
  for(const g of waveCfg.groups){
    const e=ENEMY[g.type];
    for(let i=0;i<g.count;i++){
      schedule.push({
        spawnAt:g.delayBefore+i*g.spawnInterval,
        hp:e.hp*hpMult, armor:e.armor, speed:e.speed,
        reward:e.reward, type:g.type,
        alive:true, progress:0, dots:[], slowMs:0, slowFactor:0
      });
    }
  }
  schedule.sort((a,b)=>a.spawnAt-b.spawnAt);

  const enemies=[];
  let si=0, t=0, lives=0, money=startMoney;
  const ts=towers.map(tw=>({...tw,cd:0,goldCd:0,orbitCd:0}));
  let nextSpend=1500;

  while((si<schedule.length||enemies.some(e=>e.alive))&&t<600000){
    while(si<schedule.length&&schedule[si].spawnAt<=t){
      enemies.push({...schedule[si],dots:[],alive:true,progress:0,slowMs:0,slowFactor:0});
      si++;
    }

    for(const e of enemies){
      if(!e.alive)continue;
      const spd=e.slowMs>0?e.speed*(1-e.slowFactor):e.speed;
      e.progress+=spd*SPPMS*SIM_DT;
      e.slowMs=Math.max(0,e.slowMs-SIM_DT);
      if(e.progress>=totalLen){e.alive=false;lives++;}
    }

    for(const e of enemies){
      if(!e.alive)continue;
      for(const d of e.dots){
        if(t<d.endAt){
          const eff=d.shred?e.armor*(1-d.shred):e.armor;
          e.hp-=Math.max(0,d.dps-eff)*SIM_DT/1000;
        }
      }
      e.dots=e.dots.filter(d=>t<d.endAt);
      if(e.hp<=0&&e.alive){e.alive=false;money+=e.reward;}
    }

    const live=enemies.filter(e=>e.alive);
    for(const tw of ts){
      tw.cd=Math.max(0,tw.cd-SIM_DT);
      tw.orbitCd=Math.max(0,tw.orbitCd-SIM_DT);
      const st=TOWER[tw.type].levels[tw.level];
      const wp=W(tw.row,tw.col);

      if(tw.type==='gold_mine'){
        tw.goldCd=Math.max(0,tw.goldCd-SIM_DT);
        if(tw.goldCd<=0){money+=st.income;tw.goldCd=st.interval;}
        continue;
      }
      if(tw.type==='oracle'||tw.type==='void_beacon')continue;

      if(tw.type==='orbital'){
        if(tw.orbitCd<=0&&live.length>0){
          const tgt=live.reduce((b,e)=>e.hp>b.hp?e:b,live[0]);
          const dmg=st.ignoreArmor?st.damage:Math.max(0,st.damage-tgt.armor);
          tgt.hp-=dmg;
          if(tgt.hp<=0&&tgt.alive){tgt.alive=false;money+=tgt.reward;}
          tw.orbitCd=st.cooldown;
        }
        continue;
      }
      if(tw.cd>0)continue;

      const inR=live
        .map(e=>({e,ep:posOnPath(e.progress,pathWorld)}))
        .filter(({ep})=>D(wp,ep)<=st.range)
        .sort((a,b)=>b.e.progress-a.e.progress);
      if(!inR.length)continue;
      const pri=inR[0].e;

      if(tw.type==='cryo'){
        for(const{e}of inR){e.slowMs=1500;e.slowFactor=Math.max(e.slowFactor,st.slow);
          const d=Math.max(0,st.damage-e.armor)*SIM_DT/1000;e.hp-=d;
          if(e.hp<=0&&e.alive){e.alive=false;money+=e.reward;}}
        tw.cd=st.fireRate;
      } else if(tw.type==='laser'){
        const dps=(st.baseDmg+st.maxDmg)/2;
        pri.hp-=Math.max(0,dps-pri.armor)*SIM_DT/1000;
        if(pri.hp<=0&&pri.alive){pri.alive=false;money+=pri.reward;}
        tw.cd=SIM_DT;
      } else if(tw.type==='mortar'){
        const ep=posOnPath(pri.progress,pathWorld);
        for(const e of live){
          if(D(ep,posOnPath(e.progress,pathWorld))<=st.aoe){
            const d=Math.max(0,st.damage-e.armor);e.hp-=d;
            if(e.hp<=0&&e.alive){e.alive=false;money+=e.reward;}
          }
        }
        tw.cd=st.fireRate;
      } else if(tw.type==='tesla'){
        for(const{e}of inR.slice(0,st.chain)){
          e.hp-=Math.max(0,st.damage-e.armor);
          if(e.hp<=0&&e.alive){e.alive=false;money+=e.reward;}
        }
        tw.cd=st.fireRate;
      } else if(tw.type==='alchemist'){
        pri.dots.push({dps:st.dotDps,endAt:t+st.dotDur*1000,shred:st.shred||0});
        tw.cd=st.fireRate;
      } else {
        pri.hp-=Math.max(0,st.damage-pri.armor);
        if(pri.hp<=0&&pri.alive){pri.alive=false;money+=pri.reward;}
        tw.cd=st.fireRate;
      }
    }

    if(t>=nextSpend){
      money=greedySpend(money,towers,occupied,validPos,available,path,
                        armorP,armorU,upgradeOnly,actions,`w${wi+1}`);
      for(let i=ts.length;i<towers.length;i++) ts.push({...towers[i],cd:0,goldCd:0,orbitCd:0});
      for(let i=0;i<ts.length;i++) if(towers[i]) ts[i].level=towers[i].level;
      nextSpend+=1500;
    }
    t+=SIM_DT;
  }
  return{livesLost:lives,moneyLeft:money};
}

// ── Analyze level ─────────────────────────────────────────────────────────────

function analyzeLevel(level){
  let maxArmor=0, firstArmorWave=-1;
  for(let wi=0;wi<level.waves.length;wi++){
    for(const g of level.waves[wi].groups){
      const a=ENEMY[g.type]?.armor||0;
      if(a>0&&firstArmorWave<0) firstArmorWave=wi;
      maxArmor=Math.max(maxArmor,a);
    }
  }
  // Weighted avg armor
  let totalEnemies=0, totalArmorSum=0;
  for(const w of level.waves) for(const g of w.groups){
    const e=ENEMY[g.type]; if(!e)continue;
    totalEnemies+=g.count; totalArmorSum+=g.count*e.armor;
  }
  const avgArmor=totalEnemies>0?totalArmorSum/totalEnemies:0;
  return{maxArmor,firstArmorWave,avgArmor};
}

// ── Solve ─────────────────────────────────────────────────────────────────────

function tryStrategy(level, path, pathSet, validPos, pathWorld, totalLen, cfg){
  const {budgetFrac, armorForPlacement, upgradeOnlyAfterWave} = cfg;
  const available=level.availableTowers;
  const {maxArmor,firstArmorWave,avgArmor}=analyzeLevel(level);

  const armorU=Math.max(maxArmor*0.8, avgArmor*1.5, 5);

  const towers=[], occupied=new Set(), actions=[];
  let money=level.startingMoney;

  // Initial placement
  const budget=Math.floor(money*budgetFrac);
  money=greedySpend(budget,towers,occupied,validPos,available,path,
                    armorForPlacement,armorU,false,actions,'start');
  money+=(level.startingMoney-budget); // add unspent reserve

  if(towers.length===0) return null;

  let lives=level.lives;
  for(let wi=0;wi<level.waves.length;wi++){
    const isLate = wi >= (upgradeOnlyAfterWave ?? firstArmorWave);
    const upOnly = isLate && firstArmorWave >= 0;
    const aP = isLate ? 0 : armorForPlacement; // don't score early towers by armor

    // Pre-wave spend
    money=greedySpend(money,towers,occupied,validPos,available,path,
                      aP,armorU,upOnly,actions,`pre${wi+1}`);

    const res=simulateWave(level.waves[wi],wi,towers,occupied,validPos,available,
                           path,pathWorld,totalLen,actions,money,aP,armorU,upOnly);
    lives-=res.livesLost;
    money=res.moneyLeft;
    if(lives<=0) return null;

    // Post-wave spend
    money=greedySpend(money,towers,occupied,validPos,available,path,
                      aP,armorU,upOnly,actions,`post${wi+1}`);
  }
  return{actions,livesLeft:lives};
}

function solve(level){
  const path=bfsPath(level.grid);
  const pathSet=new Set(path.map(([r,c])=>`${r},${c}`));
  const validPos=adjacentGrass(level.grid,pathSet);
  const pathWorld=path.map(([r,c])=>W(r,c));
  const totalLen=(path.length-1)*CELL_SIZE;
  const{firstArmorWave}=analyzeLevel(level);

  const strategies=[
    // No armor: greedy spend all
    {budgetFrac:1.0, armorForPlacement:0, upgradeOnlyAfterWave:999},
    {budgetFrac:0.7, armorForPlacement:0, upgradeOnlyAfterWave:999},
    // Armor: save for upgrades; after first armor wave only upgrade
    {budgetFrac:1.0, armorForPlacement:0, upgradeOnlyAfterWave:firstArmorWave},
    {budgetFrac:0.7, armorForPlacement:0, upgradeOnlyAfterWave:firstArmorWave},
    {budgetFrac:0.5, armorForPlacement:0, upgradeOnlyAfterWave:firstArmorWave},
    {budgetFrac:0.4, armorForPlacement:0, upgradeOnlyAfterWave:firstArmorWave},
    // Even more conservative initial spend
    {budgetFrac:1.0, armorForPlacement:0, upgradeOnlyAfterWave:Math.max(0,firstArmorWave-1)},
    {budgetFrac:0.6, armorForPlacement:0, upgradeOnlyAfterWave:Math.max(0,firstArmorWave-1)},
    // Spend nothing, upgrade everything
    {budgetFrac:1.0, armorForPlacement:0, upgradeOnlyAfterWave:0},
    {budgetFrac:0.5, armorForPlacement:0, upgradeOnlyAfterWave:0},
  ];

  for(const cfg of strategies){
    const r=tryStrategy(level,path,pathSet,validPos,pathWorld,totalLen,cfg);
    if(r) return r;
  }
  return null;
}

// ── Output ────────────────────────────────────────────────────────────────────

function compactArray(arr) {
  return '[' + arr.map(v => JSON.stringify(v)).join(', ') + ']';
}

function compactObject(obj) {
  const pairs = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return '{ ' + pairs.join(', ') + ' }';
}

function formatLevelJson(level) {
  const I = '  ';
  const lines = ['{'];
  const entries = Object.entries(level);

  entries.forEach(([key, value], i) => {
    const comma = i < entries.length - 1 ? ',' : '';

    if (key === 'grid') {
      lines.push(`${I}"grid": [`);
      value.forEach((row, ri) => {
        lines.push(`${I}${I}${compactArray(row)}${ri < value.length - 1 ? ',' : ''}`);
      });
      lines.push(`${I}]${comma}`);
    } else if (key === 'waves') {
      lines.push(`${I}"waves": [`);
      value.forEach((wave, wi) => {
        lines.push(`${I}${I}{`);
        lines.push(`${I}${I}${I}"groups": [`);
        wave.groups.forEach((group, gi) => {
          lines.push(`${I}${I}${I}${I}${compactObject(group)}${gi < wave.groups.length - 1 ? ',' : ''}`);
        });
        lines.push(`${I}${I}${I}]`);
        lines.push(`${I}${I}}${wi < value.length - 1 ? ',' : ''}`);
      });
      lines.push(`${I}]${comma}`);
    } else if (Array.isArray(value)) {
      lines.push(`${I}${JSON.stringify(key)}: ${compactArray(value)}${comma}`);
    } else {
      lines.push(`${I}${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}`);
    }
  });

  lines.push('}');
  return lines.join('\n') + '\n';
}

function formatActions(actions){
  const seen=new Set();
  return actions.filter(a=>{
    const k=`${a.action}:${a.type}:${a.row},${a.col}:${a.when}`;
    if(seen.has(k))return false; seen.add(k); return true;
  }).map(a=>`${a.action} ${a.type} at ${a.row},${a.col}`).join(' - ');
}

const files=readdirSync(LEVELS_DIR)
  .filter(f=>f.endsWith('.json'))
  .sort((a,b)=>parseInt(a.match(/\d+/)?.[0]||0)-parseInt(b.match(/\d+/)?.[0]||0));

let solved=0;
for(const file of files){
  const fp=join(LEVELS_DIR,file);
  const level=JSON.parse(readFileSync(fp,'utf8'));
  process.stdout.write(`Level ${level.id} "${level.name}" ... `);
  const r=solve(level);
  if(r){
    level.solution=formatActions(r.actions);
    writeFileSync(fp, formatLevelJson(level));
    console.log(`✓  lives=${r.livesLeft}`);
    solved++;
  } else {
    console.log(`✗`);
  }
}
console.log(`\n${solved}/${files.length} solved`);
