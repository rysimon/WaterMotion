/****************************************************
Matthew Bell
This program connects a Leap Motion and Arduino over
a web server. Based on the number of fingers that the
Leap Motion senses, the same number of pumps attached 
to the Arduino turn on and off in a pattern.
****************************************************/


//connecting to web socket
var webSocket = require('ws'),
	ws = new webSocket('ws://127.0.0.1:6437'),
	five = require('johnny-five'),
	Leap = require('leapjs'),
	board = new five.Board(),
	oldHandId = 0,
	oldGestureId = 0,
	speed = 5,
	extendedFingers = 0,
	motor, frame, hand,
	handType;

board.on('ready', function() 
{	
	//getting the frames from the Leap Motion
	var controller = Leap.loop({enableGestures: true}, function(frame) 
	{ 	
		checkData(frame);
	});
});

function checkData(frame)
{
	//creating a hand object
	var hand = frame.hands[0],
	finger, newHandId, gesture, 
	type, duration;
	
	
	//catching undefined hand objects when no hands are present
	if(typeof hand != "undefined")
	{
		newHandId = hand.id;
	}
	
	//if there is a new hand, we start the pumps in a new pattern
	//if we don't wait for a new hand, the Leap Motion floods the 
	//Arduino with input and the motors won't run
	if(newHandId != oldHandId && typeof hand != "undefined")
	{
		//determining whether the hand is left or right
		type = getHandType(frame);
		
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
				getGestures(gesture, frame);
			}
		}
		
		//if the hand is a left hand
		else if(type == "left")
		{
			//reset and count the number of extended fingers
			extendedFingers = 0;
			for(i = 0; i < 5; i++)
			{
				//grabbing finger objects from frame's list
				finger = hand.fingers[i];
				if(finger.extended) 
				{
					extendedFingers++;
				}
			}
			
			//let us know how many fingers the Leap Motion sees
			console.log("Extended Fingers: " + extendedFingers);
			
			//always start the new pattern with motorA
			runMotorA(extendedFingers);
			//storing the hand id of the current hand
			oldHandId = newHandId;
		}
	}
}

//figure out if the hand is left or right
function getHandType(frame)
{
	//creating a hand object
	var hand = frame.hands[0];
	if(typeof hand != "undefined")
	{
		//getting the type of hand
		handType = hand.type;
	}
	return handType;
}

//get info about the gesture
function getGestures(gesture, frame)
{
	var gestures = gesture;
	var type;
	var duration;
	var newGestureId;
	
	//tell us the gesture the Leap Motion sees
	console.log("Gesture: " + gesture.type);
	if(gesture.type == "swipe")
	{

		//tell us if the swipe is horizontal or not
		var isHorizontal = Math.abs(gestures.direction[0]) > Math.abs(gestures.direction[1]);
		newGestureId = gesture.id;
	}
	
	//classify as right-left or up-down
	if( (isHorizontal) && (oldGestureId != newGestureId) )
	{
		//if the swipe is to the right
	  if(gestures.direction[0] > 0)
	  {
		//increase the speeds of the pumps
		speed++;
		//tell us the current speed
		console.log("Speed: " + speed);
	  } 
	  //if the swipe is to the left
	  else 
	  {
		//decrease the speed
		if(speed > 1) speed--;
		//tell us the speed
		console.log("Speed " + speed);
	  }
	  oldGestureId = newGestureId;
	}
}
/*********************************************************************
Methods that control the pumps and the patterns they run in.

The current pattern being run is:
1 finger: A, B, C, D, E, back to start
2 fingers: A&B, C&D, E&A, B&C, D&E, back to start
3 fingers: A&B&C, D&E&A, B&C&D, E&A&B, C&D&E, back to start
4 fingers: A&B&C&D, E&A&B&C, D&E&A&B, C&D&E&A, B&C&D&E, back to start
**********************************************************************/
function runMotorA(num)
{
	var number = num;
	var runSpeed = speed * 1000;
	var motorA = new five.Motor([3, 0, 2]);
	var motorB = new five.Motor([5, 0, 4]);
	var motorC = new five.Motor([6, 0, 7]);
	var motorD = new five.Motor([9, 0, 8]);
	var motorE = new five.Motor([10, 0, 12]);
	
	if(number == 1)
	{
		motorA.start(255);	
		board.wait(runSpeed, function()
		{
			motorA.stop();
			if(extendedFingers == 1) 
			{
				runMotorB(number);
			}
		});
	}
	else if(number == 2)
	{			
		motorA.start(255);
		motorB.start(255);
		
		board.wait(runSpeed, function()
		{
			motorA.stop();
			motorB.stop();
			if(extendedFingers == 2) runMotorC(number);
		});
	}
	else if(number == 3)
	{
		motorA.start(255);
		motorB.start(255);
		motorC.start(255);
		
		board.wait(runSpeed, function()
		{
			motorA.stop();
			motorB.stop();
			motorC.stop();
			if(extendedFingers == 3) runMotorD(number);
		});
	}
	else if(number == 4)
	{
		motorA.start(255);
		motorB.start(255);
		motorC.start(255);
		motorD.start(255);
		
		board.wait(runSpeed, function()
		{
			motorA.stop();
			motorB.stop();
			motorC.stop();
			motorD.stop();
			if(extendedFingers == 4) runMotorE(number);
		});
	}
	else if(number == 5)
	{
		motorA.start(255);
		motorB.start(255);
		motorC.start(255);
		motorD.start(255);
		motorE.start(255);
		
		board.wait(runSpeed, function()
		{
			motorA.stop();
			motorB.stop();
			motorC.stop();
			motorD.stop();
			motorE.stop();
			if(extendedFingers == 5) runMotorE(number);
		});
	}	
}

function runMotorB(num)
{
	var number = num;
	var runSpeed = speed * 1000;
	var motorA = new five.Motor([3, 0, 2]);
	var motorB = new five.Motor([5, 0, 4]);
	var motorC = new five.Motor([6, 0, 7]);
	var motorD = new five.Motor([9, 0, 8]);
	var motorE = new five.Motor([10, 0, 12]);
	
	if(number == 1)
	{		
		motorB.start(255);	
		board.wait(runSpeed, function()
		{
			motorB.stop();
			if(extendedFingers == 1) runMotorC(number);
		});
	}
	else if(number == 2)
	{
		motorB.start(255);
		motorC.start(255);
		
		board.wait(runSpeed, function()
		{
			motorB.stop();
			motorC.stop();
			if(extendedFingers == 2) runMotorD(number);
		});
	}
	else if(number == 3)
	{
		motorB.start(255);
		motorC.start(255);
		motorD.start(255);
		
		board.wait(runSpeed, function()
		{
			motorB.stop();
			motorC.stop();
			motorD.stop();
			if(extendedFingers == 3) runMotorE(number);
		});
	}
	else if(number == 4)
	{
		motorB.start(255);
		motorC.start(255);
		motorD.start(255);
		motorE.start(255);
		
		board.wait(runSpeed, function()
		{
			motorB.stop();
			motorC.stop();
			motorD.stop();
			motorE.stop();
			if(extendedFingers == 4) runMotorA(number);
		});
	}
}

function runMotorC(num)
{
	var number = num;
	var runSpeed = speed * 1000;
	var motorA = new five.Motor([3, 0, 2]);
	var motorB = new five.Motor([5, 0, 4]);
	var motorC = new five.Motor([6, 0, 7]);
	var motorD = new five.Motor([9, 0, 8]);
	var motorE = new five.Motor([10, 0, 12]);
	
	if(number == 1)
	{
		
		motorC.start(255);	
		board.wait(runSpeed, function()
		{
			motorC.stop();
			if(extendedFingers == 1) runMotorD(number);
		});
	}
	else if(number == 2)
	{
		motorC.start(255);
		motorD.start(255);
		
		board.wait(runSpeed, function()
		{
			motorC.stop();
			motorD.stop();
			if(extendedFingers == 2) runMotorE(number);
		});
	}
	else if(number == 3)
	{
		motorC.start(255);
		motorD.start(255);
		motorE.start(255);
		
		board.wait(runSpeed, function()
		{
			motorC.stop();
			motorD.stop();
			motorE.stop();
			if(extendedFingers == 3) runMotorA(number);
		});
	}
	else if(number == 4)
	{
		motorC.start(255);
		motorD.start(255);
		motorE.start(255);
		motorA.start(255);
		
		board.wait(runSpeed, function()
		{
			motorC.stop();
			motorD.stop();
			motorE.stop();
			motorA.stop();
			if(extendedFingers == 4) runMotorB(number);
		});
	}
}

function runMotorD(num)
{
	var number = num;
	var runSpeed = speed * 1000;
	var motorA = new five.Motor([3, 0, 2]);
	var motorB = new five.Motor([5, 0, 4]);
	var motorC = new five.Motor([6, 0, 7]);
	var motorD = new five.Motor([9, 0, 8]);
	var motorE = new five.Motor([10, 0, 12]);
	
	if(number == 1)
	{
		
		motorD.start(255);	
		board.wait(runSpeed, function()
		{
			motorD.stop();
			if(extendedFingers == 1) runMotorE(number);
		});
	}
	else if(number == 2)
	{
		motorD.start(255);
		motorE.start(255);
		
		board.wait(runSpeed, function()
		{
			motorD.stop();
			motorE.stop();
			if(extendedFingers == 2) runMotorA(number);
		});
	}
	else if(number == 3)
	{
		motorD.start(255);
		motorE.start(255);
		motorA.start(255);
		
		board.wait(runSpeed, function()
		{
			motorD.stop();
			motorE.stop();
			motorA.stop();
			if(extendedFingers == 3) runMotorB(number);
		});
	}
	else if(number == 4)
	{
		motorD.start(255);
		motorE.start(255);
		motorA.start(255);
		motorB.start(255);
		
		board.wait(runSpeed, function()
		{
			motorD.stop();
			motorE.stop();
			motorA.stop();
			motorB.stop();
			if(extendedFingers == 4) runMotorC(number);
		});
	}
}

function runMotorE(num)
{
	var number = num;
	var runSpeed = speed * 1000;
	var motorA = new five.Motor([3, 0, 2]);
	var motorB = new five.Motor([5, 0, 4]);
	var motorC = new five.Motor([6, 0, 7]);
	var motorD = new five.Motor([9, 0, 8]);
	var motorE = new five.Motor([10, 0, 12]);
	
	if(number == 1)
	{
		
		motorE.start(255);	
		board.wait(runSpeed, function()
		{
			motorE.stop();
			if(extendedFingers == 1) runMotorA(number);
		});
	}
	else if(number == 2)
	{
		motorE.start(255);
		motorA.start(255);
		
		board.wait(runSpeed, function()
		{
			motorE.stop();
			motorA.stop();
			if(extendedFingers == 2) runMotorB(number);
		});
	}
	else if(number == 3)
	{
		motorE.start(255);
		motorA.start(255);
		motorB.start(255);
		
		board.wait(runSpeed, function()
		{
			motorE.stop();
			motorA.stop();
			motorB.stop();
			if(extendedFingers == 3) runMotorC(number);
		});
	}
	else if(number == 4)
	{
		motorE.start(255);
		motorA.start(255);
		motorB.start(255);
		motorC.start(255);
		
		board.wait(runSpeed, function()
		{
			motorE.stop();
			motorA.stop();
			motorB.stop();
			motorC.stop();
			if(extendedFingers == 4) runMotorD(number);
		});
	}
	else if(extendedFingers == 5)
	{
		runMotorA(5);
	}
}
