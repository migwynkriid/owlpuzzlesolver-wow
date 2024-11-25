import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PuzzleGrid = () => {
  const [activeSquares, setActiveSquares] = useState(new Set());
  const [flipMap, setFlipMap] = useState({});
  const [currentSquare, setCurrentSquare] = useState(null);
  const [isSettingFlips, setIsSettingFlips] = useState(false);
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState(null);
  const [showInitialStateSelection, setShowInitialStateSelection] = useState(false);
  const [initialState, setInitialState] = useState(new Set());
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [pendingSquare, setPendingSquare] = useState(null);
  const [currentFlipsCount, setCurrentFlipsCount] = useState(0);
  const [allSquaresConfigured, setAllSquaresConfigured] = useState(false);

  useEffect(() => {
    const checkAllSquaresConfigured = () => {
      const squaresStatus = {};
      for (let i = 1; i <= 25; i++) {
        squaresStatus[i] = false;
      }
      
      Object.keys(flipMap).forEach(key => {
        squaresStatus[key] = true;
      });
      
      const allConfigured = Object.values(squaresStatus).every(status => status);
      setAllSquaresConfigured(allConfigured);
    };

    checkAllSquaresConfigured();
  }, [flipMap]);

  const handleResetConfirm = () => {
    if (pendingSquare !== null) {
      setFlipMap(prev => {
        const newMap = { ...prev };
        delete newMap[pendingSquare + 1];
        return newMap;
      });
      setCurrentSquare(pendingSquare);
      setCurrentFlipsCount(0);
      setIsSettingFlips(true);
    }
    setShowResetDialog(false);
  };

  const handleDoneSettingFlips = () => {
    if (currentSquare !== null) {
      setFlipMap(prev => ({
        ...prev,
        [currentSquare + 1]: flipMap[currentSquare + 1] || []
      }));
    }
    setIsSettingFlips(false);
    setCurrentSquare(null);
    setCurrentFlipsCount(0);
  };

  const handleSquareClick = (index) => {
    if (showInitialStateSelection) {
      setInitialState(prev => {
        const newState = new Set(prev);
        if (newState.has(index + 1)) {
          newState.delete(index + 1);
        } else {
          newState.add(index + 1);
        }
        return newState;
      });
      return;
    }

    if (!isSettingFlips) {
      if (flipMap[index + 1]?.length >= 0) {
        setPendingSquare(index);
        setShowResetDialog(true);
        return;
      }
      setCurrentSquare(index);
      setIsSettingFlips(true);
      setCurrentFlipsCount(0);
    } else if (currentSquare !== null && index !== currentSquare) {
      const currentFlips = flipMap[currentSquare + 1] || [];
      const targetSquare = index + 1;
      
      if (currentFlips.includes(targetSquare)) {
        setFlipMap(prev => ({
          ...prev,
          [currentSquare + 1]: currentFlips.filter(x => x !== targetSquare)
        }));
        setCurrentFlipsCount(prev => prev - 1);
      } else if (currentFlipsCount < 4) {
        setFlipMap(prev => ({
          ...prev,
          [currentSquare + 1]: [...currentFlips, targetSquare]
        }));
        setCurrentFlipsCount(prev => {
          const newCount = prev + 1;
          if (newCount === 4) {
            setTimeout(() => handleDoneSettingFlips(), 0);
          }
          return newCount;
        });
      }
    }
  };

  const renderSquare = (index) => {
    const isCurrentlySelected = currentSquare === index;
    const hasFlipConnections = !isSettingFlips && flipMap[index + 1]?.length >= 0;
    const isFlipTarget = currentSquare !== null && 
                        flipMap[currentSquare + 1]?.includes(index + 1);
    const isCenterSquare = index === 12;
    const isInitialStateSelected = initialState.has(index + 1);
    
    let backgroundColor = 'bg-white';
    if (showInitialStateSelection) {
      backgroundColor = isInitialStateSelected ? 'bg-purple-500 text-white' : 'bg-white';
    } else if (isCurrentlySelected) {
      backgroundColor = 'bg-red-500 text-white';
    } else if (hasFlipConnections) {
      backgroundColor = 'bg-blue-500 text-white';
    } else if (isFlipTarget) {
      backgroundColor = 'bg-green-200';
    }

    let borderClass = 'border border-gray-300';
    if (isCenterSquare) {
      borderClass = 'border-2 border-gray-500';
    }

    return (
      <div
        key={index}
        onClick={() => handleSquareClick(index)}
        className={`w-10 h-10 cursor-pointer flex items-center justify-center text-sm transition-colors
          ${backgroundColor}
          ${borderClass}
          hover:brightness-90`}
      >
        {index + 1}
      </div>
    );
  };

  const handleFlipMapTextChange = (event) => {
    try {
      const text = event.target.value;
      const newFlipMap = {};
      
      text.split('\n').forEach(line => {
        if (line.trim()) {
          const [key, values] = line.split(':');
          if (values) {
            const flips = values.trim()
              .replace('[', '')
              .replace(']', '')
              .split(',')
              .map(n => parseInt(n.trim()))
              .filter(n => !isNaN(n));
            
            newFlipMap[parseInt(key.trim())] = flips;
          }
        }
      });
      
      setFlipMap(newFlipMap);
    } catch (err) {
      setError("Invalid flip map format");
    }
  };

  const handleSolve = () => {
    try {
      if (initialState.size === 0) {
        setError("Please select initial statue positions.");
        return;
      }

      let initialStateBits = 0;
      for (const piece of initialState) {
        initialStateBits |= (1 << (piece - 1));
      }
      
      const solution = solvePuzzle(initialStateBits);
      if (solution) {
        setSolution(solution);
        setError(null);
      } else {
        setError("No solution found for this configuration of statues.");
      }
    } catch (err) {
      setError("Error solving puzzle: " + err.message);
    }
  };

  const flipPieces = (state, piece) => {
    let newState = state;
    newState ^= (1 << (piece - 1));
    for (const p of flipMap[piece] || []) {
      newState ^= (1 << (p - 1));
    }
    return newState;
  };

  const checkWin = (state) => state === 0;

  const solvePuzzle = (initialState) => {
    const queue = [[initialState, []]];
    const visited = new Set([initialState]);

    while (queue.length > 0) {
      const [currentState, moveSequence] = queue.shift();

      if (checkWin(currentState)) {
        return moveSequence;
      }

      for (let i = 0; i < 25; i++) {
        if (currentState & (1 << i)) {
          const newState = flipPieces(currentState, i + 1);
          if (!visited.has(newState)) {
            visited.add(newState);
            queue.push([newState, [...moveSequence, i + 1]]);
          }
        }
      }
    }
    return null;
  };

  const generateFlipMapText = () => {
    const entries = Object.entries(flipMap)
      .filter(([_, flips]) => flips.length > 0)
      .map(([key, flips]) => `${key}: [${flips.join(', ')}]`)
      .join('\n');
    return entries || 'No flip connections set';
  };

  const getRemainingSquares = () => {
    const configuredSquares = new Set(Object.keys(flipMap).map(Number));
    const remaining = [];
    for (let i = 1; i <= 25; i++) {
      if (!configuredSquares.has(i)) {
        remaining.push(i);
      }
    }
    return remaining;
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>
          {showInitialStateSelection ? 'Select Current Active Owl Statues' : 'Glazer Puzzle'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-0.5 w-fit mx-auto">
            {Array.from({ length: 25 }, (_, i) => renderSquare(i))}
          </div>

          {!showInitialStateSelection && isSettingFlips && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Select up to 4 statues that will change when owl statue {currentSquare + 1} is clicked.
                  Selected: {currentFlipsCount}/4
                </AlertDescription>
              </Alert>
              <Button onClick={handleDoneSettingFlips}>Done</Button>
            </div>
          )}

          {!showInitialStateSelection && !isSettingFlips && (
            <Alert>
              <AlertDescription>
                Configure change pattern for each statue (4 statues max).
                <br />
                Remaining squares:
                <br />
                {getRemainingSquares().join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {allSquaresConfigured && !showInitialStateSelection && !isSettingFlips && (
            <Button onClick={() => setShowInitialStateSelection(true)}>
              Next Step
            </Button>
          )}

          {showInitialStateSelection && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Select the current active owl statues
                </AlertDescription>
              </Alert>
              <Button onClick={handleSolve}>Solve Puzzle</Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="font-medium">Current Owl Statue Mapping:</p>
            <Textarea
              value={generateFlipMapText()}
              onChange={handleFlipMapTextChange}
              className="font-mono text-sm"
              rows={8}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {solution && (
            <Alert>
              <AlertDescription>
                Solution found! Click owl statues in this order: {solution.join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => {
              setActiveSquares(new Set());
              setFlipMap({});
              setCurrentSquare(null);
              setIsSettingFlips(false);
              setSolution(null);
              setError(null);
              setInitialState(new Set());
              setShowInitialStateSelection(false);
              setCurrentFlipsCount(0);
              setAllSquaresConfigured(false);
            }}
            variant="outline"
          >
            Reset All Statues
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Square Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              This square already has flip connections set. Would you like to reset and reconfigure it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowResetDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm}>Reset Square</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PuzzleGrid;
