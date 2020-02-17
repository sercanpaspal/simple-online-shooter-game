/**
 * Created by Sercan PASPAL on 28.05.2017.
 */
module.exports = function(){
    var self = {
        id:"",
        health:100,
        x:250,
        y:250,
        spdX:0,
        spdY:0,
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y, 2));
    }
    return self;
}