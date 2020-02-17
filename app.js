/**
 * Created by Sercan PASPAL on 24.05.2017.
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:'+3000);
});

function detectColl(entity1, entity2){
    if(entity1.x > entity2.x && entity1.x < entity2.x + 30 && entity1.y > entity2.y && entity1.y < entity2.y + 48)
        return true;
    else
        return false;

}

var Entity = require("./game_modules/Entity.js");


var SOCKETS = {};


var Player = function(id){
    var self = Entity();
    self.id = id;
    self.speed = 2;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.point = 0;
    self.nickname;
    self.shootTimer = 0;
    self.magazine = 20;
    self.magazineCapacity = 20;
    self.reloadMagazineTimer = 0;
    self.keys = {};

    var super_update = self.update;
    self.update = function(){
        self.updateSpd();
        super_update();

        if(self.pressingAttack){
            if(self.shootTimer++%10==0){
                self.shootBullet(self.mouseAngle);
            }
        }else{
            self.shootTimer = 0;
        }

        // auto reload
        if(self.magazine<1){
            self.reloadMagazineTimer++;
            if(self.reloadMagazineTimer>120){
                self.reloadMagazineTimer = 0;
                self.magazine = self.magazineCapacity;
            }
        }
        // reload trigg
        if(self.keys[82] && self.magazine<self.magazineCapacity){
            self.magazine = 0;
        }
    }
    self.shootBullet = function(angle){
        if(self.magazine>0){
            var b = Bullet(angle, id);
            b.x = self.x + 40;
            b.y = self.y + 30;
            self.magazine--;
        }
    }
    self.updateSpd = function(){
        // right
        if(self.keys[68])
            self.spdX = self.speed;
        // left
        else if(self.keys[65])
            self.spdX = -self.speed;
        else
            self.spdX = 0;
        // up
        if(self.keys[87])
            self.spdY = -self.speed;
        // down
        else if(self.keys[83])
            self.spdY = self.speed;
        else
            self.spdY = 0;
    }
    self.setDead = function(){
        self.x = 50;
        self.y = 50;
        self.health = 100;
    }
    Player.list[id] = self;
    return self;
}
Player.list = {};
Player.onConnect = function(socket){
    var player = new Player(socket.id);
    socket.on('keyPress', function(data){
        player.keys[data.inputId] = data.state;
        if(data.inputId === 'attack')
            player.pressingAttack = data.state;
        if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}
Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            id:player.id,
            nickname:player.nickname,
            health:player.health,
            x:player.x,
            y:player.y,
            point: player.point,
            magazine:player.magazine,
            magazineCapacity:player.magazineCapacity
        })
    }
    return pack;
}

var Bullet = function(angle, source){
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
Bullet.list = {};
Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        pack.push({
            x:bullet.x,
            y:bullet.y
        });
    }
    return pack;
}

io.on('connection', function(socket){
    socket.id = Math.random();
    SOCKETS[socket.id] = socket;

    socket.emit("id", socket.id);

    socket.on("nickname", function(nickname){
        Player.onConnect(socket);
        Player.list[socket.id].nickname = nickname;
    });


    socket.on('disconnect', function(){
        delete SOCKETS[socket.id];
        Player.onDisconnect(socket);
    });

});

setInterval(function () {
    var pack = {
        player:Player.update(),
        bullet:Bullet.update()
    }

    for(var i in SOCKETS){
        var socket = SOCKETS[i];
        socket.emit('positions', pack);
    }
},1000/60);