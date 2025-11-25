document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const playerTeamContainer = document.getElementById('player-team');
    const enemyTeamContainer = document.getElementById('enemy-team');
    const messageLog = document.getElementById('message-log');
    const skillButtonsContainer = document.getElementById('skill-buttons');
    const gameContainer = document.getElementById('game-container');

    // --- Game State ---
    let characters = {};
    let playerTurn = true;
    let selectedCharacterId = null;
    let selectedSkill = null;
    let gameOver = false;

    // --- Character & Skill Definitions ---
    const characterDefinitions = {
        // Player Team
        player_tank: { name: "Tank", icon: "🛡️", hp: 150, maxHp: 150, team: 'player', skills: ['shield_bash', 'fortify'] },
        player_dealer: { name: "Dealer", icon: "⚔️", hp: 100, maxHp: 100, team: 'player', skills: ['strong_attack', 'quick_attack'] },
        player_healer: { name: "Healer", icon: "💖", hp: 80, maxHp: 80, team: 'player', skills: ['heal', 'minor_attack'] },
        // Enemy Team
        enemy_tank: { name: "Enemy Tank", icon: "🤖", hp: 140, maxHp: 140, team: 'enemy', skills: ['strong_attack'] },
        enemy_dealer1: { name: "Enemy Dealer", icon: "💣", hp: 90, maxHp: 90, team: 'enemy', skills: ['strong_attack'] },
        enemy_dealer2: { name: "Enemy Dealer", icon: "💣", hp: 90, maxHp: 90, team: 'enemy', skills: ['quick_attack'] },
    };

    const skillDefinitions = {
        // Player Skills
        shield_bash: { name: 'Shield Bash', target: 'enemy', action: (casterId, targetId) => attack(casterId, targetId, 20) },
        fortify: { name: 'Fortify', target: 'self', action: (casterId) => applyShield(casterId, 30) },
        strong_attack: { name: 'Strong Attack', target: 'enemy', action: (casterId, targetId) => attack(casterId, targetId, 35) },
        quick_attack: { name: 'Quick Attack', target: 'enemy', action: (casterId, targetId) => attack(casterId, targetId, 15) },
        heal: { name: 'Heal', target: 'player', action: (casterId, targetId) => heal(casterId, targetId, 40) },
        minor_attack: { name: 'Minor Attack', target: 'enemy', action: (casterId, targetId) => attack(casterId, targetId, 10) },
    };

    // --- Game Initialization ---
    function initGame() {
        // Reset state
        playerTurn = true;
        selectedCharacterId = null;
        selectedSkill = null;
        gameOver = false;
        characters = {};
        
        // Clear containers
        playerTeamContainer.innerHTML = '';
        enemyTeamContainer.innerHTML = '';
        skillButtonsContainer.innerHTML = '';

        // Create characters
        for (const id in characterDefinitions) {
            createCharacter(id, characterDefinitions[id]);
        }
        
        renderAllCharacters();
        updateMessage("게임 시작! 당신의 턴입니다. 아군을 선택하세요.");

        // Remove restart button if it exists
        const oldRestartBtn = document.getElementById('restart-btn');
        if(oldRestartBtn) oldRestartBtn.remove();
    }

    // --- Character Creation & Rendering ---
    function createCharacter(id, props) {
        characters[id] = { 
            ...props, 
            id: id, 
            shield: 0,
            isDead: false,
        };
    }

    function renderAllCharacters() {
        Object.values(characters).forEach(char => {
            const container = char.team === 'player' ? playerTeamContainer : enemyTeamContainer;
            renderCharacter(char.id, container);
        });
    }

    function renderCharacter(charId, container) {
        const char = characters[charId];
        let charElement = document.getElementById(char.id);

        if (!charElement) {
            charElement = document.createElement('div');
            charElement.id = char.id;
            charElement.className = 'character';
            container.appendChild(charElement);

            if (char.team === 'player') {
                charElement.addEventListener('click', () => onCharacterClick(char.id));
            }
        }
        
        charElement.innerHTML = `
            <div class="char-icon">${char.icon}</div>
            <div class="char-name">${char.name}</div>
            <div class="hp-bar-container">
                <div class="hp-bar" style="width: ${Math.max(0, (char.hp / char.maxHp) * 100)}%;"></div>
            </div>
            <div class="hp-text">${char.hp > 0 ? char.hp : 0} / ${char.maxHp} ${char.shield > 0 ? ` (+${char.shield})` : ''}</div>
        `;
        
        // Update classes
        charElement.classList.toggle('selected', selectedCharacterId === char.id);
        charElement.classList.toggle('dead', char.isDead);
    }
    
    // --- Player Actions ---
    function onCharacterClick(charId) {
        if (gameOver) return;

        const clickedChar = characters[charId];
        
        // If it's not the player's turn or the character is dead, do nothing
        if (!playerTurn || clickedChar.isDead) return;

        // Case 1: Selecting a friendly character
        if (clickedChar.team === 'player') {
            selectedCharacterId = charId;
            selectedSkill = null;
            updateMessage(`${clickedChar.name} 선택. 스킬을 고르세요.`);
            renderSkillButtons(clickedChar.skills);
        }

        // Case 2: A skill is selected, and we are choosing a target
        if (selectedSkill) {
            const skillDef = skillDefinitions[selectedSkill];
            const caster = characters[selectedCharacterId];

            // Check if the target is valid for the skill
            if (skillDef.target === 'enemy' && clickedChar.team === 'enemy') {
                useSkill(selectedCharacterId, charId, selectedSkill);
            } else if (skillDef.target === 'player' && clickedChar.team === 'player') {
                useSkill(selectedCharacterId, charId, selectedSkill);
            } else if (skillDef.target === 'self') {
                // This is handled by the skill button itself
                return;
            }
        }
        
        renderAllCharacters();
    }
    
    function renderSkillButtons(skillIds) {
        skillButtonsContainer.innerHTML = '';
        skillIds.forEach(skillId => {
            const skillDef = skillDefinitions[skillId];
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            btn.innerText = skillDef.name;
            btn.addEventListener('click', () => onSkillClick(skillId));
            skillButtonsContainer.appendChild(btn);
        });
    }

    function onSkillClick(skillId) {
        const skillDef = skillDefinitions[skillId];
        selectedSkill = skillId;
        
        // Highlight selected button
        document.querySelectorAll('.skill-btn').forEach(b => b.classList.remove('selected'));
        event.target.classList.add('selected');

        if (skillDef.target === 'self') {
            useSkill(selectedCharacterId, selectedCharacterId, selectedSkill);
        } else {
             updateMessage(`${skillDef.name} 사용! ${skillDef.target === 'enemy' ? '적' : '아군'} 대상을 선택하세요.`);
             // Add targeting class to valid targets
             document.querySelectorAll('.character').forEach(el => {
                 const char = characters[el.id];
                 if(char && !char.isDead && char.team === skillDef.target){
                     el.classList.add('targetable');
                     // Re-add click listener for enemies
                     if(char.team === 'enemy') {
                        el.addEventListener('click', () => onCharacterClick(char.id));
                     }
                 }
             });
        }
    }

    function useSkill(casterId, targetId, skillId) {
        if (!casterId || !targetId || !skillId) return;
        
        const skillDef = skillDefinitions[skillId];
        skillDef.action(casterId, targetId);
        
        // Cleanup after using a skill
        selectedSkill = null;
        document.querySelectorAll('.character').forEach(el => el.classList.remove('targetable'));
        skillButtonsContainer.innerHTML = ''; // Clear skills after use
        
        if (checkGameOver()) return;

        // Switch to AI turn
        playerTurn = false;
        updateMessage("적의 턴입니다...");
        setTimeout(aiTurn, 1500);
    }

    // --- Core Game Logic Functions ---
    function attack(casterId, targetId, baseDamage) {
        const caster = characters[casterId];
        const target = characters[targetId];
        let damage = baseDamage;

        // Apply damage, considering shield first
        if (target.shield > 0) {
            const shieldDamage = Math.min(target.shield, damage);
            target.shield -= shieldDamage;
            damage -= shieldDamage;
        }

        target.hp -= damage;
        
        updateMessage(`${caster.name}(이)가 ${target.name}에게 ${baseDamage}의 데미지를 입혔습니다!`);
        showEffect(targetId, `-${baseDamage}`, 'damage-effect');

        if (target.hp <= 0) {
            target.hp = 0;
            target.isDead = true;
            updateMessage(`${target.name}(이)가 쓰러졌습니다.`);
        }
        
        renderCharacter(targetId);
    }

    function heal(casterId, targetId, amount) {
        const caster = characters[casterId];
        const target = characters[targetId];
        if (target.isDead) return;

        target.hp = Math.min(target.maxHp, target.hp + amount);
        updateMessage(`${caster.name}(이)가 ${target.name}의 체력을 ${amount} 회복시켰습니다.`);
        showEffect(targetId, `+${amount}`, 'heal-effect');
        renderCharacter(targetId);
    }
    
    function applyShield(casterId, amount) {
        const caster = characters[casterId];
        caster.shield += amount;
        updateMessage(`${caster.name}(이)가 방어 태세를 갖춥니다. (+${amount} 쉴드)`);
        showEffect(casterId, `+${amount}`, 'shield-effect');
        renderCharacter(casterId);
    }
    
    // --- AI Logic ---
    function aiTurn() {
        if (gameOver) return;

        const livingEnemies = Object.values(characters).filter(c => c.team === 'enemy' && !c.isDead);
        const livingPlayers = Object.values(characters).filter(c => c.team === 'player' && !c.isDead);
        
        if(livingEnemies.length === 0) {
            endTurn();
            return;
        }

        const attacker = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
        
        // Simple AI: attack the player with the lowest HP
        let target = livingPlayers.sort((a, b) => a.hp - b.hp)[0];

        if (attacker && target) {
            const skillId = attacker.skills[Math.floor(Math.random() * attacker.skills.length)]; // Use a random skill
            const skillDef = skillDefinitions[skillId];
            setTimeout(() => {
                skillDef.action(attacker.id, target.id);
                if (checkGameOver()) return;
                endTurn();
            }, 1000);
        } else {
            endTurn();
        }
    }
    
    function endTurn() {
        if (gameOver) return;
        playerTurn = true;
        selectedCharacterId = null;
        selectedSkill = null;
        renderAllCharacters();
        updateMessage("당신의 턴입니다. 아군을 선택하세요.");
    }

    // --- Utility Functions ---
    function updateMessage(msg) {
        messageLog.innerText = msg;
    }

    function showEffect(targetId, text, effectClass) {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const effect = document.createElement('div');
        effect.className = `effect ${effectClass}`;
        effect.innerText = text;
        
        // Position effect over the character
        effect.style.left = `${targetElement.offsetLeft + targetElement.offsetWidth / 2 - 15}px`;
        effect.style.top = `${targetElement.offsetTop}px`;
        
        // Append to the game board to be contained
        document.getElementById('game-board').appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }
    
    function checkGameOver() {
        const livingPlayers = Object.values(characters).filter(c => c.team === 'player' && !c.isDead).length;
        const livingEnemies = Object.values(characters).filter(c => c.team === 'enemy' && !c.isDead).length;

        if (livingPlayers === 0) {
            gameOver = true;
            updateMessage("패배했습니다... 다시 도전하시겠습니까?");
            showRestartButton();
            return true;
        }
        if (livingEnemies === 0) {
            gameOver = true;
            updateMessage("승리! 적 팀을 모두 물리쳤습니다!");
            showRestartButton();
            return true;
        }
        return false;
    }
    
    function showRestartButton() {
        let restartBtn = document.getElementById('restart-btn');
        if (!restartBtn) {
            restartBtn = document.createElement('button');
            restartBtn.id = 'restart-btn';
            restartBtn.innerText = '다시 시작';
            restartBtn.addEventListener('click', initGame);
            gameContainer.appendChild(restartBtn);
        }
        restartBtn.style.display = 'block';
    }


    // --- Start Game ---
    initGame();
});
