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
	motor, frame, hand;
var oldHandId = 0;
var handType;
var oldGestureId = 0;
var speed = 5;
var extendedFingers = 0;

//self-invoking function
board.on('ready', function() 
{	
	var controller = Leap.loop({enableGestures: true}, function(frame) 
	{ 	
		checkData(frame, controller);
	});
});

function checkData(frame, controller)
{
	//creating a hand object
	var hand = frame.hands[0];
	//getting the current number of fingers present
	var finger;
	var newHandId;

	
	
	////////////////////////////////////////NEW CODE//////////////////////////////////////////
	var gesture;
	var type;
	var duration;
	
	//enabling gestures
	///////////////////////////////////////////////////////////////////////////////////////////
	
	
	
	
	//catching undefined hand objects when no hands are present
	if(typeof hand != "undefined")
	{
//		extendedFingers = 0;
		newHandId = hand.id;
		
		/*for(i = 0; i < 5; i++)
		{
			finger = hand.fingers[i];
			if(finger.extended) 
			{
				extendedFingers++;
			}
		}*/
	}
	
	//if there is a new hand, we start the pumps in a new pattern
	//if we don't wait for a new hand, the Leap Motion floods the 
	//Arduino with input and the motors won't run
	if(newHandId != oldHandId && typeof hand != "undefined")
	{
		type = getHandType(frame);
		
		if(frame.gestures.length > 0 && type == "right")
		{
			gesture = frame.gestures[0];
			
			if(gesture.duration/1000 > 100)
			{
				getGestures(gesture, frame);
				/*console.log("Sending:");
				console.log(gesture);*/
			}
		}
		
		else if(type == "left")
		{
			extendedFingers = 0;
			for(i = 0; i < 5; i++)
			{
				finger = hand.fingers[i];
				if(finger.extended) 
				{
					extendedFingers++;
				}
			}
			
			console.log(extendedFingers);
			//always start the new pattern with motorA
			runMotorA(extendedFingers);
			console.log(extendedFingers);
			
			//storing the hand id of the current hand
			oldHandId = newHandId;
		}
	}
}

function getHandType(frame)
{
	//getting whether the hand is a left or right hand
	var hand = frame.hands[0];
	if(typeof hand != "undefined")
	{
		handType = hand.type;
	}
	return handType;
}

function getGestures(gesture, frame)
{
	var gestures = gesture;
	var type;
	var duration;
	var newGestureId;
	
	console.log(gesture.type);
	if(gesture.type == "swipe")
	{

		var isHorizontal = Math.abs(gestures.direction[0]) > Math.abs(gestures.direction[1]);
		newGestureId = gesture.id;
		/*console.log("Getting:");
		console.log(gesture);*/
	}
	
	//Classify as right-left or up-down
	if( (isHorizontal) &&(oldGestureId != newGestureId) )
	{
	  if(gestures.direction[0] > 0)
	  {
		speed++;
		console.log(speed);
	  } 
	  else 
	  {
		if(speed > 1) speed--;
		console.log(speed);
	  }
	  oldGestureId = newGestureId;
	}
}
/*********************************************************************
Methods that control the pumps and the patterns they run in.
This is messier than I would like it to be. The team needs to 
look into ways that we can simplify these processes.

The current pattern being run is:
1 finger: A, B, C, D, E, back to start
2 fingers: A&B, C&D, E&A, B&C, D&E, back to start
3 fingers: A&B&C, D&E&A, B&C&D, E&A&B, C&D&E, back to start
4 fingers: A&B&C&D, E&A&B&C, D&E&A&B, C&D&E&A, B&C&D&E, back to start
**********************************************************************/
function runMotorA(num)
{
	//how can we make these global so that we don't
	//have to create new objects every time we call a method?
	//when I made them global, javascript kept throwing
	//a TypeError. It was saying the objects were of type null
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
