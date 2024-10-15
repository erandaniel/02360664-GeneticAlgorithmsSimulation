import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useRef, useState, useEffect, useCallback } from 'react';



// easy to change configuration
const DEFAULT_POPULATION_SIZE = 24 // amount of "genes" (aka solutions) in each generation
const DEFAULT_MUTATION_RATE = 0.01 // [0,1] (the probability of a gene mutation on each part of the solution) - look at mutate function.
const DEFAULT_CROSSOVER_RATE = 0.7 // [0,1] (the probability of 2 solutions to create child together) - look at crossover function.
const DEFAULT_NUM_OF_CITIES = 20 // for TPS problem
const DEFAULT_PERCENTAGE_OF_POPULATION_TO_EVOLVE = 10 // for example 10 => 10% of best solution continue as is to the next generation.
const TournamentSize = 3; // tournament size to chose a random parent in the evolution - look at selectParentFromRandomTournament function.
const LeaderBoardNumberOfTopSolutions = 50 // as seen in the web GUI leaderboard

// NOTE! if you want to edit the genetic algorithm search for "actual genetic algorithm code" in the code

// boring configuration
const TspLeaderBoardDotColor = 'blue'
const TspLeaderBoardLineColor = 'red'
const TspLeaderBoardLineWidth = '0.7'
const TspLeaderBoardDotWidth = '3'
const TspCityDargEditorSize = 200;
const TspLeaderBoardCanvasSize = 200;
const PopulationSizeSliderMin = 1;
const PopulationSizeSliderMax = 300;
const CitiesSizeSliderMin = 5;
const CitiesSizeSliderMax = 150;

const KnapsackVisualization = ({ selection, numItems }) => {
  return (
    <div className="flex flex-wrap">
      {selection.map((selected, i) => (
        <div
          key={i}
          className={`w-4 h-4 m-1 ${selected ? 'bg-green-500' : 'bg-gray-300'}`}
          title={`Item ${i + 1}: ${selected ? 'Selected' : 'Not Selected'}`}
        />
      ))}
    </div>
  );
};


// Main component
const Main = () => {
  //////////////////////////////////////////////////////////////////////|| || || || //////////
  //////////////////////////////////////////////////////////////////////|| || || || //////////
  /* This are some boring var definitions take a look at the code below || || || || *////////
  //////////////////////////////////////////////////////////////////////\/ \/ \/ \//////////
  //////////////////////////////////////////////////////////////////////////////////////////
  const [population, setPopulation] = useState([]);
  const [numItems, setNumItems] = useState(20);
  const [problem, setProblem] = useState('tsp');
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [populationSize, setPopulationSize] = useState(DEFAULT_POPULATION_SIZE);
  const [mutationRate, setMutationRate] = useState(DEFAULT_MUTATION_RATE);
  const [crossoverRate, setCrossoverRate] = useState(DEFAULT_CROSSOVER_RATE);
  const [numCities, setNumCities] = useState(DEFAULT_NUM_OF_CITIES);
  const [percentageToEvolve, setPercentageToEvolve] = useState(DEFAULT_PERCENTAGE_OF_POPULATION_TO_EVOLVE);
  const [generationTime, setGenerationTime] = useState(1);
  const [bestSolution, setBestSolution] = useState(null);
  const [fitnessHistory, setFitnessHistory] = useState([]);
  const [topSolutions, setTopSolutions] = useState([]);
  const [cities, setCities] = useState([]);
  //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!! This is the actual genetic algorithm code!!!!!!!!!!!!!!!!!!!!!!!!!
  //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // this function control how each generation is created
  const evolveGeneration = () => {
    const eliteCount = Math.floor(populationSize * DEFAULT_PERCENTAGE_OF_POPULATION_TO_EVOLVE / 100);
    const elite = population.slice(0, eliteCount);

    let newPopulation = [...elite];

    while (newPopulation.length < populationSize) {
      const parent1 = selectParentFromRandomTournament();
      const parent2 = selectParentFromRandomTournament();
      let [child1, child2] = crossover(parent1, parent2); // might not make new solution and return the same ones
      child1 = mutate(child1);
      child2 = mutate(child2);
      newPopulation.push(child1, child2);
    }

    newPopulation = newPopulation.slice(0, populationSize);
    evaluatePopulation(newPopulation);
    setGeneration(prev => prev + 1);
  }

  // random by users "Mutation Rate" value look at comment on var "DEFAULT_MUTATION_RATE"
  // in TSP mutation means swapping between 2 cities
  // in knapsack problem mutation means 0=>1 or 1=>0 ( 1=taking, 0=not taking an item)
  const mutate = (individual) => {
    if (problem === 'tsp') {
      const mutatedChromosome = [...individual.chromosome];
      for (let i = 0; i < mutatedChromosome.length; i++) {
        if (Math.random() < mutationRate) {
          const j = Math.floor(Math.random() * mutatedChromosome.length);
          [mutatedChromosome[i], mutatedChromosome[j]] = [mutatedChromosome[j], mutatedChromosome[i]];
        }
      }
      return { ...individual, chromosome: mutatedChromosome, fitness: 0 };
    } else {
      const mutatedChromosome = individual.chromosome.map(gene =>
        Math.random() < mutationRate ? (gene === 0 ? 1 : 0) : gene
      );
      return { ...individual, chromosome: mutatedChromosome, fitness: 0 };
    }
  };

  // this is the way 2 parents make the sons genes, or "how to make a new solution..."
  // TSP Use parent (OX) creating 2 solutions from 2 parents:
  // takes random substring from first parent, and in the other position in the array take the
  // corresponding cities from the other parent (the ones that was not in the first substring)
  // the other son is created in the same way but the parents are changing roles.
  // can read more about it in https://mat.uab.cat/~alseda/MasterOpt/GeneticOperations.pdf 
  // Knapsack - random slice of each parent will make the sons genes ===|+++++++
  // if example if the gene is of length 5 and the parents are 11111 and 00000 and the
  // random point was 2 then the son will be 11000 (2 from parent1 and the rest from parent 2)
  const crossover = (parent1, parent2) => {
    if (Math.random() > crossoverRate) return [parent1, parent2];

    const child1Chromosome = new Array(parent1.chromosome.length).fill(-1);
    const child2Chromosome = new Array(parent2.chromosome.length).fill(-1);

    if (problem === 'tsp') {
      const crossoverPoint1 = Math.floor(Math.random() * parent1.chromosome.length);
      const crossoverPoint2 = Math.floor(Math.random() * parent1.chromosome.length);
      const [start, end] = [
        Math.min(crossoverPoint1, crossoverPoint2),
        Math.max(crossoverPoint1, crossoverPoint2)
      ];


      // Copy the selected segment
      for (let i = start; i <= end; i++) {
        child1Chromosome[i] = parent1.chromosome[i];
        child2Chromosome[i] = parent2.chromosome[i];
      }

      // Fill the remaining positions
      let index1 = (end + 1) % parent1.chromosome.length;
      let index2 = (end + 1) % parent2.chromosome.length;
      for (let i = 0; i < parent1.chromosome.length; i++) {
        const pos = (end + 1 + i) % parent1.chromosome.length;
        if (child1Chromosome[pos] === -1) {
          while (child1Chromosome.includes(parent2.chromosome[index2])) {
            index2 = (index2 + 1) % parent2.chromosome.length;
          }
          child1Chromosome[pos] = parent2.chromosome[index2];
        }
        if (child2Chromosome[pos] === -1) {
          while (child2Chromosome.includes(parent1.chromosome[index1])) {
            index1 = (index1 + 1) % parent1.chromosome.length;
          }
          child2Chromosome[pos] = parent1.chromosome[index1];
        }
      }

      return [
        { chromosome: child1Chromosome, fitness: 0 },
        { chromosome: child2Chromosome, fitness: 0 }
      ];
    } else {
      const crossoverPoint = Math.floor(Math.random() * parent1.chromosome.length);
      return [
        {
          chromosome: [...parent1.chromosome.slice(0, crossoverPoint), ...parent2.chromosome.slice(crossoverPoint)],
          fitness: 0
        },
        {
          chromosome: [...parent2.chromosome.slice(0, crossoverPoint), ...parent1.chromosome.slice(crossoverPoint)],
          fitness: 0
        }
      ];
    }
  };

  // each parents are chosen in a tournament
  // 3 solutions are chosen at random from all the population abd the best one out of those 3.
  // you can edit var tournamentSize above
  const selectParentFromRandomTournament = useCallback(() => {
    const tournament = Array.from({ length: TournamentSize }, () => population[Math.floor(Math.random() * population.length)]);
    return tournament.reduce((best, current) => (current.fitness > best.fitness ? current : best));
  }, [population]);

  // the fitness function determent how good a solution is.
  // the better the score ==> the better the solution.
  // for TSP its the shorter the path the better the solution.
  // for Knapsack - its determent by the sum of items taken (this is kind of a weak example where we can take all items..)
  // if you wish to know more about the Knapsack with genetic algo, take a look at https://www.youtube.com/watch?v=CRtZ-APJEKI
  const fitnessFunction = useCallback((chromosome) => {
    if (problem === 'tsp') {
      if (cities.length === 0) return 0; // Return 0 fitness if no cities are available
      let totalDistance = 0;
      for (let i = 0; i < chromosome.length; i++) {
        const city1 = cities[chromosome[i]];
        const city2 = cities[chromosome[(i + 1) % chromosome.length]];
        if (city1 && city2) {
          totalDistance += Math.sqrt(Math.pow(city2.x - city1.x, 2) + Math.pow(city2.y - city1.y, 2));
        }
      }
      // if you want to change the fitness function change this line :)
      return totalDistance === 0 ? 0 : (TspLeaderBoardCanvasSize ** 2) / (totalDistance);
    } else {
      return (chromosome.reduce((sum, gene) => sum + gene, 0) / chromosome.length) * 100;
    }
  }, [problem, cities]);

  //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !!!!!!!!!!!!!!!!!! end of actual genetic algorithm code!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  /* FROM HERE ITS JUST BORING CODE... *////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////

 
  
  // this is where the random city are generated
  const generateCitiesRandomly = useCallback(() => {
    const newCities = Array.from({ length: numCities }, () => ({
      x: Math.random() * (TspLeaderBoardCanvasSize - 20) + 3, // Keeping a 5-unit margin from edges
      y: Math.random() * (TspLeaderBoardCanvasSize - 20) + 3
    }));
    setCities(newCities);
  }, [numCities]);

  // create random solutions for start, changing this might lead to better solutions
  const initializePopulation = useCallback(() => {
    if (problem === 'tsp' && cities.length === 0) {
      generateCitiesRandomly();
    }
    const newPopulation = Array.from({ length: populationSize }, () => ({
      chromosome: problem === 'tsp'
        ? shuffleArrayRandomly([...Array(numCities).keys()])
        : Array.from({ length: numItems }, () => Math.random() > 0.5 ? 1 : 0),
      fitness: 0
    }));
    evaluatePopulation(newPopulation);
  }, [problem, populationSize, numCities, numItems, cities, generateCitiesRandomly]);

  // calculating the fitness function for each solution in the population
  // also sorting the solutions by this fitness from best to worst
  // also updating the top solutions and leaderboard
  const evaluatePopulation = (pop) => {
    const evaluatedPopulation = pop.map(individual => ({
      ...individual,
      fitness: fitnessFunction(individual.chromosome)
    }));
    evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);
    setPopulation(evaluatedPopulation);
    setBestSolution(evaluatedPopulation[0]);
    setFitnessHistory(prev => [...prev, { generation, fitness: evaluatedPopulation[0].fitness }]);
    setTopSolutions(evaluatedPopulation.slice(0, LeaderBoardNumberOfTopSolutions));
  };


  // used in crossover() 
  const shuffleArrayRandomly = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };



  const resetSimulation = () => {
    setRunning(false);
    setGeneration(0);
    setFitnessHistory([]);
    initializePopulation();
  };


  // Main evolution function
  const evolveOneGeneration = useCallback(() => {
    evolveGeneration();
  }, [populationSize, population, selectParentFromRandomTournament, crossover, mutate, evaluatePopulation]);

  const updateCityPosition = (index, newX, newY) => {
    setCities(prevCities => {
      const newCities = [...prevCities];
      newCities[index] = { x: newX, y: newY };
      return newCities;
    });
  };

 
  useEffect(() => {
    if (problem === 'tsp') {
      generateCitiesRandomly();
    }
  }, [problem, numCities, generateCitiesRandomly]);

  // each time the problem or any of its parameters is changed, restart the problem
  useEffect(() => {
    initializePopulation();
  }, [problem, populationSize, numCities, numItems]);

  // generation "clock"
  useEffect(() => {
    let intervalId;
    if (running) {
      intervalId = setInterval(() => {
        evolveOneGeneration();
      }, generationTime);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [running, generationTime, evolveOneGeneration]);




  return (
    
     <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {/* Header with logo and title */}
        

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Algorithm Parameters</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Population Size: {populationSize}
                  </label>
                  <Slider
                    value={populationSize}
                    onChange={setPopulationSize}
                    min={PopulationSizeSliderMin}
                    max={PopulationSizeSliderMax}
                    step={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mutation Rate: {mutationRate.toFixed(2)}
                  </label>
                  <Slider
                    value={mutationRate}
                    onChange={setMutationRate}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crossover Rate: {crossoverRate.toFixed(2)}
                  </label>
                  <Slider
                    value={crossoverRate}
                    onChange={setCrossoverRate}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Elite percentage (will make the next generation): {percentageToEvolve}%
                  </label>
                  <Slider
                    value={percentageToEvolve}
                    onChange={setPercentageToEvolve}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>

                   <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generation Time: {generationTime}ms
              </label>
        <Slider
        value={generationTime}
        onChange={setGenerationTime}
        min={0}
                max={2000}
                step={10}
              />
            </div>

                {problem === 'tsp' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Cities: {numCities}
                    </label>
                    <Slider
                      value={numCities}
                      onChange={setNumCities}
                      min={CitiesSizeSliderMin}
                      max={CitiesSizeSliderMax}
                      step={1}
                    />
                  </div>
                ): 
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Knapsack size: {numItems}
                    </label>
                    <Slider
                      value={numItems}
                      onChange={setNumItems}
                      min={CitiesSizeSliderMin}
                      max={CitiesSizeSliderMax}
                      step={1}
                    />
                  </div>
                }
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4">Problem Type</h2>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setProblem('tsp')}
                  className={`px-4 py-2 rounded-md ${problem === 'tsp' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Traveling Salesman
                </button>
                <button
                  onClick={() => setProblem('knapsack')}
                  className={`px-4 py-2 rounded-md ${problem === 'knapsack' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Knapsack Problem
                </button>
              </div>
              {problem === 'tsp' && (
      <div className="w-full flex flex-col items-center">
        <TspCityDargEditor cities={cities} updateCityPosition={updateCityPosition} />
        <button
          onClick={() => {
            generateCitiesRandomly();
            resetSimulation();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Randomize Cities
        </button>
      </div>
    )}
            </div>
          </div>

          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setRunning(!running)}
              className={`px-6 py-2 rounded-md ${running ? 'bg-red-500' : 'bg-green-500'} text-white`}
            >
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={resetSimulation}
              className="px-6 py-2 rounded-md bg-yellow-500 text-white"
            >
              Reset
            </button>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">Current Generation: {generation}</h2>
            <h3 className="text-xl font-semibold mb-2">
              Best Solution Fitness: {bestSolution?.fitness.toFixed(2)}
            </h3>
            <p className="text-lg mb-4">Route: {bestSolution?.chromosome.join(', ')}</p>

            <h2 className="text-2xl font-semibold mb-4">Fitness over time:</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fitnessHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fitness" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Leaderboard
            topSolutions={topSolutions}
            problem={problem}
            cities={cities}
            numItems={numCities}
          />
        </div>
      </div>
    </div>
  );
};

const TspCityDargEditor = ({ cities, updateCityPosition }) => {
  const [draggedCityIndex, setDraggedCityIndex] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (draggedCityIndex !== null && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(0, event.clientX - svgRect.left), TspCityDargEditorSize);
        const y = Math.min(Math.max(0, event.clientY - svgRect.top), TspCityDargEditorSize);
        updateCityPosition(draggedCityIndex, x, y);
      }
    };

    const handleMouseUp = () => {
      setDraggedCityIndex(null);
    };

    if (draggedCityIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedCityIndex, updateCityPosition, TspCityDargEditorSize]);

  return (
    <div className="mt-4 flex flex-col items-center w-full">
      <h3 className="text-lg font-semibold mb-2">Cities - Drag to edit</h3>
      <svg
        ref={svgRef}
        width={TspCityDargEditorSize}
        height={TspCityDargEditorSize}
        className="border border-gray-300"
      >
        {cities.map((city, i) => (
          <circle
            key={i}
            cx={city.x}
            cy={city.y}
            r="4"
            fill="blue"
            cursor="move"
            onMouseDown={() => setDraggedCityIndex(i)}
          />
        ))}
      </svg>
    </div>
  );
};


// not in use
const TspCityManualEditor = ({ cities, updateCityPosition }) => {
  return (
    <div className="mt-4">
      <h3 className="flex text-lg font-semibold mb-2">Edit City Positions Manually </h3>
      {cities.map((city, cityNumber) => (
        <div key={cityNumber} className="flex items-center space-x-2 mb-2">
          <span>City {cityNumber}:</span>
          <input
            type="number"
            value={city.x.toFixed(2)}
            onChange={(e) => updateCityPosition(cityNumber, parseFloat(e.target.value), city.y)}
            className="w-20 px-2 py-1 border rounded"
          />
          <input
            type="number"
            value={city.y.toFixed(2)}
            onChange={(e) => updateCityPosition(cityNumber, city.x, parseFloat(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
        </div>
      ))}
    </div>
  );
};

// solution as shown in the leaderboard 
const TspSingleSolution = ({ path, cities }) => {
  if (!cities || cities.length === 0) {
    return <div>No cities available</div>;
  }
  return (
    <svg width={TspLeaderBoardCanvasSize} height={TspLeaderBoardCanvasSize} className="border border-gray-300">
      {cities.map((city, i) => (
        <circle key={i} cx={city.x} cy={city.y} r={TspLeaderBoardDotWidth} fill={TspLeaderBoardDotColor} />
      ))}
      {path.map((cityIndex, i) => {
        const from = cities[cityIndex];
        const to = cities[path[(i + 1) % path.length]];
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={TspLeaderBoardLineColor}
            strokeWidth={TspLeaderBoardLineWidth}
          />
        );
      })}
    </svg>
  );
};

// the best X solutions in the current generation
const Leaderboard = ({ topSolutions, problem, cities, numItems }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topSolutions.map((solution, index) => (

          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Rank {index + 1}</h3>
            <p>Fitness: {solution.fitness.toFixed(2)}</p>
            {problem === 'tsp' ? (
              <TspSingleSolution path={solution.chromosome} cities={cities} />
            ) : (
              <KnapsackVisualization selection={solution.chromosome} numItems={numItems} />
            )}
          </div>

        )
        )}
      </div>
    </div>
  );
};

const Slider = ({ value, onChange, min, max, step }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  );
};


export default Main;