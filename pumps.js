/****************************************************
Matthew Bell
This program connects a Leap Motion and Arduino over
a web server. Based on the number of fingers that the
Leap Motion senses, the same number of pumps attached 
to the Arduino turn on and off in a pattern.
****************************************************/
var Leap = require('leapjs'),
	five = require('johnny-five');
	
//JavaScript does not have overloading, so we are forced 
//to work with a single constructor
var LeapMotion = function(oldHandId, newHandId)
{
	//not all parameters must be defined when creating an 
	//instance of a class. If they are not defined, we 
	//set their default value
	if(typeof oldHandId == "undefined") this.oldHandId = 0;
	else this.oldHandId = oldHandId;
	if(typeof newHandId == "undefined") this.newHandId = 0;
	else this.newHandId = newHandId;
};

//getters and setters
LeapMotion.prototype.setOldHandId = function(oldHandId)
{
	this.oldHandId = oldHandId;
};

LeapMotion.prototype.setNewHandId = function(newHandId)
{
	this.newHandId = newHandId;
};

LeapMotion.prototype.setExtendedFingers = function(extendedFingers)
{
	this.extendedFingers = extendedFingers;
};

LeapMotion.prototype.getOldHandId = function()
{
	return this.oldHandId;
};

LeapMotion.prototype.getNewHandId = function()
{
	return this.newHandId;
};

LeapMotion.prototype.checkData = function(frame)
{
	//creating a hand object
	var hand = frame.hands[0],
		finger, gesture, type, 
		count;
	
	
	//catching undefined hand objects when no hands are present
	if(typeof hand != "undefined")
	{	
		//determining whether the hand is left or right
		type = this.getHandType(frame);
		
		//if there is a gesture and it is the right hand
		if(frame.gestures.length > 0 && type == "right")
		{
			//grab the gesture object from the frame's gesture list
			gesture = frame.gestures[0];
			
			//if the gesture is more than a millisecond
			//gestures are recorded in microseconds
			//(1 microsecond = 1x10^-6 seconds)
			if(gesture.duration/1000 > 100)
			{
				this.getGestures(gesture, frame);
			}
		}
		//if the hand is a new left hand
		else if(type == "left")
		{
			this.newHandId = hand.id;
			motorObj.setNewHandId(this.newHandId);
		}
	}
	
	//if there is a new hand, we start the pumps in a new pattern
	//if we don't wait for a new hand, the Leap Motion floods the 
	//Arduino with input and the motors won't run
	if(this.newHandId != this.oldHandId && typeof hand != "undefined")
	{
		//determining whether the hand is left or right
		type = this.getHandType(frame);
		
		//if the hand is a left hand
		if(type == "left")
		{	
			//start a new count
			count = 0;
			//reset and count the number of extended fingers
			motorObj.setExtendedFingers(0);
			for(i = 0; i < 5; i++)
			{
				//grabbing finger objects from frame's list
				finger = hand.fingers[i];
				if(finger.extended) 
				{
					motorObj.setExtendedFingers(motorObj.getExtendedFingers() + 1);
				}
			}
			
			//let us know how many fingers the Leap Motion sees
			console.log("Extended Fingers: " + motorObj.getExtendedFingers());
			
			//always start the new pattern with motorA
			motorObj.runMotorA(count);
		}
		//storing the hand id of the current hand
		this.oldHandId = this.newHandId;
		motorObj.setOldHandId(this.newHandId);
	}
};

	//figure out if the hand is left or right
LeapMotion.prototype.getHandType = function(frame)
{
	//creating a hand object
	var hand = frame.hands[0],
		handType;
	
	if(typeof hand != "undefined")
	{
		//getting the type of hand
		handType = hand.type;
	}
	return handType;
};

	//get info about the gesture
LeapMotion.prototype.getGestures = function(gesture, frame)
{
	var gestures = gesture,
		type = gestures.type;
	
	//tell us the gesture the Leap Motion sees
	console.log("Gesture: " + type);
	if(type == "swipe")
	{
		//tell us if the swipe is horizontal or not
		var isHorizontal = Math.abs(gestures.direction[0]) > Math.abs(gestures.direction[1]);
	}
	
	//classify as right-left or up-down
	if(isHorizontal)
	{
		//if the swipe is to the right
	  if(gestures.direction[0] > 0)
	  {
		//increase the speeds of the pumps
		motorObj.setSpeed(motorObj.getSpeed() + 1);
		//tell us the current speed
		console.log("Speed: " + motorObj.getSpeed());
	  } 
	  //if the swipe is to the left
	  else 
	  {
		//decrease the speed
		if(motorObj.getSpeed() > 1) motorObj.setSpeed(motorObj.getSpeed() - 1);
		//tell us the speed
		console.log("Speed " + motorObj.getSpeed());
	  }
	}
};

var Motor = function(oldHandId, newHandId, extendedFingers, speed)
{
	if(typeof oldHandId == "undefined") this.oldHandId = 0;
	else this.oldHandId = oldHandId;
	if(typeof newHandId == "undefined") this.newHandId = 0;
	else this.newHandId = newHandId;
	if(typeof extendedFingers == "undefined") this.extendedFingers = 0;
	else this.extendedFingers = extendedFingers;
	if(typeof speed == "undefined") this.speed = 5;
	else this.speed = speed;
};

//getters and setters
Motor.prototype.setOldHandId = function(oldHandId)
{
	this.oldHandId = oldHandId;
};

Motor.prototype.setNewHandId = function(newHandId)
{
	this.newHandId = newHandId;
};

Motor.prototype.setSpeed = function(speed)
{
	this.speed = speed;
};

Motor.prototype.setExtendedFingers = function(extendedFingers)
{
	this.extendedFingers = extendedFingers;
};

Motor.prototype.getOldHandId = function()
{
	return this.oldHandId;
};

Motor.prototype.getNewHandId = function()
{
	return this.newHandId;
};

Motor.prototype.getSpeed = function()
{
	return this.speed;
};

Motor.prototype.getExtendedFingers = function()
{
	return this.extendedFingers;
};
/*********************************************************************
	Methods that control the pumps and the patterns they run in.

	The current pattern being run is:
	1 finger: A, B, C, D, E, back to start
	2 fingers: A&B, B&C, C&D, D&E, E&A, back to start
	3 fingers: A&B&C, B&C&D, C&D&E, D&E&A, E&A&B, back to start
	4 fingers: A&B&C&D, B&C&D&E, C&D&E&A, D&E&A&B, E&A&B&C, back to start
**********************************************************************/
Motor.prototype.runMotorA = function(counter)
{
	var count = counter,
		id = this.newHandId + 1,
		runSpeed = this.speed * 1000,
		motorArray = [new five.Motor([3, 0, 2]), new five.Motor([5, 0, 4]),
					new five.Motor([6, 0, 7]), new five.Motor([9, 0, 8]),
					new five.Motor([10, 0, 12])],
		number, motor;
	
	//checking to see if there is a new hand
	if(id == (this.newHandId + 1))
	{
		//runs through motors based on the number of fingers present
		//this was done because it was necessary to start at different 
		//points in order to get the patterns we wanted
		for(var i = count; i < (this.extendedFingers + count); i++)
		{
			//if we are going above the last index of the array we reset
			if(i > 4) number = i - 5;
			else number = i;
			console.log("1Running: " + number);
			//had to use motor variable
			//if we tried to use the array to start the motor, it would
			//through a type error
			motor = motorArray[number];
			motor.start(255);
		}
		board.wait(runSpeed, function()
		{
			//if there is no new hand present
			//we need these checking occasionally because 
			//these pumps are waiting for a period and then 
			//running a new function. This causes issues when 
			//we place new hands in view of the Leap Motion as the 
			//new function will run and stick to the old pattern when 
			//a new pattern is also going due to the old pattern.
			//this eliminates the old pattern from continuing when a new
			//pattern begins
			if(id == (motorObj.getNewHandId() + 1))
			{
				for(var j = count; j < (motorObj.getExtendedFingers() + count); j++)
				{
					if(j > 4) number = j - 5;
					else number = j;
					console.log("1Stopping: " + number);
					motor = motorArray[number];
					motor.stop();
				}
				count++;
				if(count > 4) count = 0;
				//keeps the motors running.
				//this is basically an artificial while loop.
				//using a while loop is impossible with this program 
				//because as soon as we enter a while loop, we lose contact
				//with the Leap Motion controller. So we have to create our 
				//own while loop using two separate methods. This allows us
				//to constantly get info from the Leap Motion controller.
				motorObj.runMotorB(count);
			}	
		});
	}
};
//both runMotorA and runMotorB work in the same fashion
Motor.prototype.runMotorB = function(counter)
{
	var count = counter,
		runSpeed = this.speed * 1000,
		id = this.newHandId + 1,
		motorArray = [new five.Motor([3, 0, 2]), new five.Motor([5, 0, 4]),
					new five.Motor([6, 0, 7]), new five.Motor([9, 0, 8]),
					new five.Motor([10, 0, 12])],
		number, motor;
	
	if(id == (this.newHandId + 1))
	{
		for(var i = count; i < (this.extendedFingers + count); i++)
		{
			if(i > 4) number = i - 5;
			else number = i;
			console.log("2Running: " + number);
			motor = motorArray[number];
			motor.start(255);
		}
		board.wait(runSpeed, function()
		{
			if(id == motorObj.getNewHandId() + 1)
			{
				for(var j = count; j < motorObj.getExtendedFingers() + count; j++)
				{
					if(j > 4) number = j - 5;
					else number = j;
					console.log("2Stopping: " + number);
					motor = motorArray[number];
					motor.stop();
				}
				count++;
				if(count > 4) count = 0;
				
				if(id == motorObj.getNewHandId() + 1) motorObj.runMotorA(count);
			}
		});
	}
};

//creating LeapMotion, Motor, and Board objects
var leapObj = new LeapMotion(),
	motorObj = new Motor(),
	board = new five.Board();
	
//starting the program
board.on('ready', function() 
{	
//getting the frames from the Leap Motion
	var controller = Leap.loop({enableGestures: true}, function(frame) 
	{ 	
		leapObj.checkData(frame);
	});
});
