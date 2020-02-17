/**
 * Created by Sercan PASPAL on 28.05.2017.
 */
module.exports = function(angle, source){
    var x = angle.x - Player.list[source].x - 8 - 40;
    var y = angle.y - Player.list[source].y - 8 - 30;
    var angle = Math.atan2(y,x) / Math.PI * 180;

    var self = Entity();
    self.source = source;
    self.id = Math.random();
    self.spdX = Math.cos(angle/180*Math.PI) * 10;
    self.spdY = Math.sin(angle/180*Math.PI) * 10;
    self.damage = 10;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++>50)
            self.toRemove = true;
        super_update();

        if(self.toRemove)
            delete Bullet.list[self.id];

        for(var i in Player.list){
            if(detectColl(self, Player.list[i]) && Player.list[i].id!=self.source){
                Player.list[i].health -= self.damage;
                if(Player.list[i].health<1){
                    Player.list[i].setDead();
                    Player.list[source].point += 1;
                }
                delete Bullet.list[self.id];
            }

        }
    }
    Bullet.list[self.id] = self;
    return self;
}