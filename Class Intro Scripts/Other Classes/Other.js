game_log("---Script Start---");
//Put monsters you want to kill in here
var monster_targets = ["minimush", "bee"];

//Movement And Attacking
setInterval(function () {
        var target = find_viable_targets()[0];
		//Attack or move to target
        if (target != null) {
            if (distance_to_point(target.real_x, target.real_y) < character.range) {
                if (can_attack(target)) {
                    attack(target);
                }
            }
            else {
                move_to_target(target);
            }
        }
}, 100);//Execute 10 times per second

//Potions And Looting
setInterval(function () {
    loot();

    //Heal With Potions if we're below 75% hp.
    if (character.hp / character.max_hp < 0.75 || character.mp / character.max_mp < 0.75) {
        use_hp_or_mp();
    }
}, 500 );//Execute 2 times per second

//Returns the distance of the character to a point in the world.
function distance_to_point(x, y) {
    return Math.sqrt(Math.pow(character.real_x - x, 2) + Math.pow(character.real_y - y, 2));
}

//This function will ether move straight towards the target entity,
//or utilize smart_move to find their way there.
function move_to_target(target) {
    if (can_move_to(target.real_x, target.real_y)) {
        smart.moving = false;
        smart.searching = false;
        move(
            character.real_x + (target.real_x - character.real_x) / 2,
            character.real_y + (target.real_y - character.real_y) / 2
        );
    }
    else {
        if (!smart.searching && !smart.moving) {
            smart_move({ x: target.real_x, y: target.real_y }, function () { pathing = false; });
        }
    }
}
//Returns an ordered array of all relevant targets as determined by the following:
////1. The monsters' type is contained in the 'monsterTargets' array.
////2. The monster is attacking you or a party member.
////3. The monster is not targeting someone outside your party.
//The order of the list is as follows:
////Monsters attacking you or party members are ordered first.
////Monsters are then ordered by distance.
function find_viable_targets() {
    var monsters = Object.values(parent.entities).filter(
        mob => (mob.target == null
                    || parent.party_list.includes(mob.target)
                    || mob.target == character.name)
                && (mob.type == "monster"
                    && (parent.party_list.includes(mob.target)
                        || mob.target == character.name))
                    || monster_targets.includes(mob.mtype));

    for (id in monsters) {
        var monster = monsters[id];

        if (parent.party_list.includes(monster.target)
                    || monster.target == character.name) {
            monster.targeting_party = 1;
        }
        else {
            monster.targeting_party = 0;
        }
    }

    //Order monsters by whether they're attacking us, then by distance.
    monsters.sort(function (current, next) {
        if (current.targeting_party > next.targeting_party) {
            return -1;
        }
        var dist_current = distance(character, current);
        var dist_next = distance(character, next);
        // Else go to the 2nd item
        if (dist_current < dist_next) {
            return -1;
        }
        else if (dist_current > dist_next) {
            return 1
        }
        else {
            return 0;
        }
    });
    return monsters;
}