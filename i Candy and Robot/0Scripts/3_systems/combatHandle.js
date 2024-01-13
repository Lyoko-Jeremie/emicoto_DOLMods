function combatTest() {
    // 循环当前NPC
    const drugs = Items.search('drugs', 'or', 'pill', 'inject').filter(item => !item.id.has('angel') && iCandy.getStat(item.id, 'efTimer') - V.timeStamp <= 1800);
    for (let i = 0; i < V.NPCList.length; i++) {
        const npc = V.NPCList[i];

        // 先初始化feed
        if (npc.feed == undefined) {
            npc.feed = 0;
        }

        // 如果NPC的手为空，则有概率拿起针头or药丸
        if ((npc.lefthand == 0 || npc.righthand == 0) && random(100) < 30) {
            npc.takeItem = {
                item  : drugs.random(),
                timer : 0
            };
            V.afterMsg += `${npc.fullDescription}拿起了${npc.takeItem.item.name}<br>`;
        }

        if (npc.takenItem) {
            npc.takenItem.timer += 1;

            // 下回合开始时，进行行为判断
            if (npc.takenItem.timer > 1) {
                if (V.playerAction.lefthand == 'hitoff' || V.playerAction.righthand == 'hitoff') {
                    // 如果PC试图打掉NPC手中的物品，则有概率打掉
                    if (random(100) < 20) {
                        V.afterMsg += `${npc.fullDescription}的${npc.takenItem.item.name}被打掉了<br>`;
                        npc.takenItem = undefined;
                    }
                    // 否则，NPC有概率投喂PC
                    else if (random(100) < 30) {
                        V.afterMsg += `${npc.fullDescription}投喂了${npc.takenItem.item.name}<br>`;
                        npc.feed++;
                        npc.takenItem = undefined;
                    }
                }
            }
        }
    }
}

function iCombatActionHandle() {
    if (V.leftaction == 'whackdrugs' || V.rightaction == 'whackdrugs') {
        T.addMsg += '你试图打掉对方手中的药物，';
        if (random(100) < 30) {
            T.addMsg += '并成功了。对方看起来更加生气了。<br>';
        }
        else {
            T.addMsg += '但是失败了。对方看起来更加生气了。<br>';
        }
    }
}


function iCombatHandle() {
    const whitelistnpc = ['Avery', 'Briar', 'Darryl', 'Eden', 'Harper', 'Kylar', 'Landry', 'Morgan', 'Whitney', 'Winter', 'Remy', 'Wren', 'Cheng'];
    // 非战斗场景跳过
    if (V.combat == 0) return;
    if (V.stalk == true) return;

    // 游戏前三天大概率跳过
    if (Time.days < 3 && random(100) > 25) {
        R.combat.skip = true;
        return;
    }

    // 非白名单NPC跳过
    if (V.npc.length > 0 && !V.npc.has(...whitelistnpc)) return;

    if (F.getLocation() == 'livestock' && random(100) > 30) {
        R.combat.skip = true;
        return;
    }

    // 如果场景在学校，则看概率跳过
    if (V.location == 'school' && random(100) > 10) {
        R.combat.skip = true;
        return;
    }
    // 如果场景在警察局，则看概率跳过
    if (V.location == 'police_station' && random(100) > 30) {
        R.combat.skip = true;
        return;
    }
    // 白名单NPC看概率跳过
    if (V.npc.length > 0 && V.npc.has(...whitelistnpc) && random(100) > 40) {
        R.combat.skip = true;
        return;
    }
    // 合意场景看概率跳过
    if (V.consensual == 1 && V.npc.length == 0 && random(100) > 50) {
        R.combat.skip = true;
        return;
    }
    // 已经跳过的，跳过
    if (R.combat.skip == true) return;


    // 当pc处于反抗状态且处于优势时，跳过事件。
    if (V.pain < V.painmax * 0.8
		&& V.arousal < V.arousalmax * 0.8
		&& V.enemyhealth < V.enemyhealthmax * 0.3
		&& V.orgasmdown < 1 && V.rightarm !== 'bound' && V.leftarm !== 'bound'
		&& V.leftleg !== 'bound' && V.rightleg !== 'bound'
    ) return;

    const rate = V.trauma / 80 + V.stress / 200;
    const drugs = Items.search('drugs', 'or', 'pill', 'inject')
        .filter(item => item.id.has('angel') && iCandy.getStat(item.id, 'efTimer') - V.timeStamp <= 1800);

    console.log('combat feed drugs:',drugs);

    let html = '';


    // 当敌人是触手或史莱姆或植物时，概率给pc上特殊分泌物
    if ((V.enemytype == 'slime' || V.enemytype == 'tentacles' || V.enemytype == 'plant') && !iCandy.senseGet('genital', 'slime')) {
        if (random(100) < 20 && (V.anususe !== 0 || V.mouthuse !== 0)) {
            wikifier('drugs', 2000);
            iCandy.senseSet('genital', 'slime', 1.2, 3600);
            html += combatFeedMsg(V.enemytype, 'drugs');
            R.combat.slime = 1;
        }
    }

    if (V.enemytype !== 'man') return;
    // 人类的情况，根据情况概率喂pc毒品

    for (let i = 0; i < V.enemynomax; i++) {
        const npc = V.NPCList[i];
        // 不能行动的，不是人类的，每个npc最多喂两次
        if (npc.stance == 'defeated' || npc.type !== 'human' || npc.feed >= 2) {
            continue;
        }
        // 如果pc有行动能力且npc血量过低，跳过
        if (V.pain < V.painmax && npc.health < npc.healthmax * 0.3 &&  V.orgasmdown < 1 && V.rightarm !== 'bound' && V.leftarm !== 'bound' && V.leftleg !== 'bound' && V.rightleg !== 'bound') {
            continue;
        }

        if (npc.feed == undefined) {
            npc.feed = 0;
        }

        // 当PC创伤或压力高于安全阈值时，NPC高概率喂PC天使粉。如果已经处于药效范围内，跳过
        if (V.trauma >= V.traumamax * 0.8 || V.stress >= V.stressmax * 0.8) {
            if (iCandy.getStat('angelpowder', 'efTimer') > V.timeStamp) {
                continue;
            }

            if (random(100) < 30 && R.combat.angel < 1 && (F.getLocation() !== 'livestock' || random(100) < 6)) {
                html += combatFeedMsg(npc, 'angelpowder_inject');
                npc.feed++;
                R.combat.angel++;
                R.combat.total++;
                continue;
            }
        }
        
        // 其他情况根据创伤，疼痛，压力计算概率，随机喂PC毒品
        if (random(100) <= rate && R.combat.total < 3 && drugs.length > 0) {
            const drug = drugs.random();
			
            html += combatFeedMsg(npc, drug.id);
			
            npc.feed++;
            R.combat.total++;
            continue;
        }

        // 嘴巴空着的话，概率投喂春药、致幻剂
    }

    console.log('combat handle:',html);

    if (html.length > 2) {
        V.afterMsg += html;
    }
}


Object.defineProperties(window.iCandy, {
    iCombatHandle : { value : iCombatHandle, writable : false }
});