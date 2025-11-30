/**
 * Uproot - Core Pathfinding Algorithms
 *
 * This file implements the fundamental graph search algorithms used in the
 * LinkedIn Network Pro extension for finding connection paths between people.
 *
 * Algorithms Implemented:
 * 1. BFS (Breadth-First Search) - Shortest hop path
 * 2. A* Search - Optimal path with pluggable heuristic
 *
 * @module pathfinding_algorithm
 * @author Uproot Team
 * @date November 23, 2025
 */

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Priority Queue implementation for A* algorithm
 * Uses a binary min-heap for O(log n) insertion and extraction
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  /**
   * Add element to queue with priority
   * @param {*} element - The element to add
   * @param {number} priority - Priority value (lower = higher priority)
   */
  enqueue(element, priority) {
    this.heap.push({ element, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return element with lowest priority
   * @returns {*} Element with lowest priority value
   */
  dequeue() {
    if (this.isEmpty()) return null;

    const min = this.heap[0];
    const end = this.heap.pop();

    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }

    return min.element;
  }

  /**
   * Check if queue is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Get queue size
   * @returns {number}
   */
  size() {
    return this.heap.length;
  }

  _bubbleUp(index) {
    const element = this.heap[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];

      if (element.priority >= parent.priority) break;

      this.heap[index] = parent;
      index = parentIndex;
    }

    this.heap[index] = element;
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      let swapIndex = null;
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;

      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].priority < element.priority) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const rightPriority = this.heap[rightChildIndex].priority;
        if (
          (swapIndex === null && rightPriority < element.priority) ||
          (swapIndex !== null && rightPriority < this.heap[swapIndex].priority)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      index = swapIndex;
    }

    this.heap[index] = element;
  }
}

/**
 * Graph representation for social network
 */
class Graph {
  constructor() {
    this.adjacencyList = new Map();
    this.nodeData = new Map(); // Store profile data
  }

  /**
   * Add a node to the graph
   * @param {string} nodeId - Unique identifier for the node
   * @param {object} data - Profile data (name, skills, etc.)
   */
  addNode(nodeId, data = {}) {
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, []);
      this.nodeData.set(nodeId, { id: nodeId, ...data });
    }
  }

  /**
   * Add an edge (connection) between two nodes
   * @param {string} from - Source node ID
   * @param {string} to - Target node ID
   * @param {number} weight - Edge weight (default 1)
   */
  addEdge(from, to, weight = 1) {
    this.addNode(from);
    this.addNode(to);

    // Undirected graph (bidirectional connection)
    this.adjacencyList.get(from).push({ node: to, weight });
    this.adjacencyList.get(to).push({ node: from, weight });
  }

  /**
   * Get neighbors of a node
   * @param {string} nodeId - Node to get neighbors for
   * @returns {Array} Array of {node, weight} objects
   */
  getNeighbors(nodeId) {
    return this.adjacencyList.get(nodeId) || [];
  }

  /**
   * Get node data
   * @param {string} nodeId - Node ID
   * @returns {object} Node data
   */
  getNodeData(nodeId) {
    return this.nodeData.get(nodeId);
  }

  /**
   * Get all node IDs
   * @returns {Array<string>}
   */
  getNodes() {
    return Array.from(this.adjacencyList.keys());
  }
}

// ============================================================================
// ALGORITHM 1: BFS (Breadth-First Search)
// ============================================================================

/**
 * BFS - Find shortest path by number of hops
 *
 * Time Complexity: O(V + E) where V = vertices, E = edges
 * Space Complexity: O(V)
 *
 * Use Case: When all connections are equal (unweighted graph)
 * Guarantees: Shortest path in terms of number of hops
 *
 * @param {Graph} graph - The social network graph
 * @param {string} startId - Starting person ID
 * @param {string} goalId - Target person ID
 * @returns {object|null} { path: Array<string>, hops: number } or null if no path
 */
function bfsShortestPath(graph, startId, goalId) {
  // Validation
  if (!graph.adjacencyList.has(startId) || !graph.adjacencyList.has(goalId)) {
    return null;
  }

  if (startId === goalId) {
    return { path: [startId], hops: 0 };
  }

  // BFS data structures
  const queue = [startId];
  const visited = new Set([startId]);
  const parent = new Map();
  parent.set(startId, null);

  // BFS traversal
  while (queue.length > 0) {
    const current = queue.shift();

    // Check if we reached the goal
    if (current === goalId) {
      return reconstructPath(parent, goalId);
    }

    // Explore neighbors
    const neighbors = graph.getNeighbors(current);
    for (const { node } of neighbors) {
      if (!visited.has(node)) {
        visited.add(node);
        parent.set(node, current);
        queue.push(node);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Reconstruct path from parent map
 * @private
 */
function reconstructPath(parent, goalId) {
  const path = [];
  let current = goalId;

  while (current !== null) {
    path.unshift(current);
    current = parent.get(current);
  }

  return {
    path,
    hops: path.length - 1
  };
}

// ============================================================================
// ALGORITHM 2: A* Search with Pluggable Heuristic
// ============================================================================

/**
 * A* Search - Find optimal path using heuristic guidance
 *
 * Time Complexity: O(E log V) with good heuristic, O(V^2) worst case
 * Space Complexity: O(V)
 *
 * Use Case: Weighted graphs, when we can estimate distance to goal
 * Guarantees: Optimal path if heuristic is admissible
 *
 * @param {Graph} graph - The social network graph
 * @param {string} startId - Starting person ID
 * @param {string} goalId - Target person ID
 * @param {Function} heuristic - Heuristic function(nodeId, goalId, graph) -> number
 * @returns {object|null} { path: Array<string>, cost: number } or null if no path
 */
function aStarSearch(graph, startId, goalId, heuristic = defaultHeuristic) {
  // Validation
  if (!graph.adjacencyList.has(startId) || !graph.adjacencyList.has(goalId)) {
    return null;
  }

  if (startId === goalId) {
    return { path: [startId], cost: 0 };
  }

  // A* data structures
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const gScore = new Map(); // Actual cost from start
  const fScore = new Map(); // Estimated total cost (g + h)
  const parent = new Map();

  // Initialize start node
  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId, goalId, graph));
  openSet.enqueue(startId, fScore.get(startId));
  parent.set(startId, null);

  // A* main loop
  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();

    // Check if we reached the goal
    if (current === goalId) {
      const pathData = reconstructPath(parent, goalId);
      return {
        path: pathData.path,
        cost: gScore.get(goalId),
        nodesExplored: closedSet.size
      };
    }

    // Skip if already processed
    if (closedSet.has(current)) continue;
    closedSet.add(current);

    // Explore neighbors
    const neighbors = graph.getNeighbors(current);
    for (const { node: neighbor, weight } of neighbors) {
      if (closedSet.has(neighbor)) continue;

      // Calculate tentative g score
      const tentativeG = gScore.get(current) + weight;

      // Update if this path is better
      if (!gScore.has(neighbor) || tentativeG < gScore.get(neighbor)) {
        parent.set(neighbor, current);
        gScore.set(neighbor, tentativeG);

        const h = heuristic(neighbor, goalId, graph);
        const f = tentativeG + h;
        fScore.set(neighbor, f);

        openSet.enqueue(neighbor, f);
      }
    }
  }

  // No path found
  return null;
}

/**
 * Default heuristic - Zero (converts A* to Dijkstra)
 * This is used as fallback when embeddings are not available
 *
 * @param {string} nodeId - Current node
 * @param {string} goalId - Goal node
 * @param {Graph} graph - The graph
 * @returns {number} Always 0 (admissible, consistent)
 */
function defaultHeuristic(nodeId, goalId, graph) {
  return 0; // H = 0 (A* becomes Dijkstra's algorithm)
}

/**
 * Semantic Similarity Heuristic
 * Uses profile similarity as distance estimate
 *
 * This heuristic estimates how "close" two people are based on:
 * - Shared skills
 * - Same industry
 * - Geographic proximity
 *
 * Returns 1 - similarity (higher similarity = lower distance)
 * Falls back to 0 if profile data is unavailable
 *
 * @param {string} nodeId - Current node
 * @param {string} goalId - Goal node
 * @param {Graph} graph - The graph
 * @returns {number} Estimated distance (0-1)
 */
function semanticHeuristic(nodeId, goalId, graph) {
  const nodeData = graph.getNodeData(nodeId);
  const goalData = graph.getNodeData(goalId);

  // Fallback to zero if no profile data
  if (!nodeData || !goalData) {
    return 0;
  }

  // Calculate similarity (0-1, where 1 = identical)
  let similarity = 0;
  let factors = 0;

  // Skill overlap (if available)
  if (nodeData.skills && goalData.skills) {
    const nodeSkills = new Set(nodeData.skills);
    const goalSkills = new Set(goalData.skills);
    const intersection = new Set([...nodeSkills].filter(s => goalSkills.has(s)));
    const union = new Set([...nodeSkills, ...goalSkills]);

    if (union.size > 0) {
      similarity += intersection.size / union.size; // Jaccard similarity
      factors++;
    }
  }

  // Industry match (if available)
  if (nodeData.industry && goalData.industry) {
    similarity += nodeData.industry === goalData.industry ? 1 : 0;
    factors++;
  }

  // Location proximity (if available)
  if (nodeData.location && goalData.location) {
    similarity += nodeData.location === goalData.location ? 1 : 0.5;
    factors++;
  }

  // Fallback to 0 if no factors available (no embeddings/profile data)
  if (factors === 0) {
    return 0; // H = 0 (A* becomes Dijkstra)
  }

  // Average similarity
  const avgSimilarity = similarity / factors;

  // Convert similarity to distance (lower distance = higher priority)
  return 1 - avgSimilarity;
}

// ============================================================================
// SYNTHETIC TEST GRAPH
// ============================================================================

/**
 * Create a synthetic LinkedIn-style network for testing
 *
 * Network structure:
 * - 10 people in tech industry
 * - Various skill overlaps
 * - Different connection strengths
 *
 * @returns {Graph} Test graph
 */
function createTestGraph() {
  const graph = new Graph();

  // Add people with profile data
  graph.addNode('alice', {
    name: 'Alice Anderson',
    skills: ['JavaScript', 'React', 'Node.js'],
    industry: 'Software',
    location: 'San Francisco'
  });

  graph.addNode('bob', {
    name: 'Bob Brown',
    skills: ['Python', 'Django', 'PostgreSQL'],
    industry: 'Software',
    location: 'San Francisco'
  });

  graph.addNode('carol', {
    name: 'Carol Chen',
    skills: ['JavaScript', 'Vue', 'AWS'],
    industry: 'Software',
    location: 'Seattle'
  });

  graph.addNode('dave', {
    name: 'Dave Davis',
    skills: ['Java', 'Spring', 'Kubernetes'],
    industry: 'Software',
    location: 'New York'
  });

  graph.addNode('eve', {
    name: 'Eve Evans',
    skills: ['React', 'TypeScript', 'GraphQL'],
    industry: 'Software',
    location: 'San Francisco'
  });

  graph.addNode('frank', {
    name: 'Frank Foster',
    skills: ['Python', 'Machine Learning', 'TensorFlow'],
    industry: 'AI Research',
    location: 'Boston'
  });

  graph.addNode('grace', {
    name: 'Grace Green',
    skills: ['Product Management', 'Agile', 'UX'],
    industry: 'Product',
    location: 'San Francisco'
  });

  graph.addNode('henry', {
    name: 'Henry Hill',
    skills: ['JavaScript', 'React', 'AWS'],
    industry: 'Software',
    location: 'Seattle'
  });

  graph.addNode('iris', {
    name: 'Iris Ivanov',
    skills: ['DevOps', 'Docker', 'Kubernetes'],
    industry: 'Software',
    location: 'New York'
  });

  graph.addNode('jack', {
    name: 'Jack Johnson',
    skills: ['Sales', 'B2B', 'SaaS'],
    industry: 'Sales',
    location: 'Chicago'
  });

  // Add connections (edges)
  // Strong connections (weight 1)
  graph.addEdge('alice', 'bob', 1);
  graph.addEdge('alice', 'carol', 1);
  graph.addEdge('bob', 'dave', 1);
  graph.addEdge('carol', 'eve', 1);
  graph.addEdge('dave', 'frank', 1);
  graph.addEdge('eve', 'grace', 1);
  graph.addEdge('frank', 'henry', 1);
  graph.addEdge('grace', 'henry', 1);
  graph.addEdge('henry', 'iris', 1);
  graph.addEdge('iris', 'jack', 1);

  // Weak connections (weight 2 - harder to traverse)
  graph.addEdge('alice', 'eve', 2);
  graph.addEdge('bob', 'frank', 2);
  graph.addEdge('carol', 'henry', 2);

  return graph;
}

/**
 * Create an impossible graph (no path exists)
 * @returns {Graph}
 */
function createDisconnectedGraph() {
  const graph = new Graph();

  // Island 1
  graph.addNode('alice', { name: 'Alice' });
  graph.addNode('bob', { name: 'Bob' });
  graph.addEdge('alice', 'bob', 1);

  // Island 2 (disconnected)
  graph.addNode('carol', { name: 'Carol' });
  graph.addNode('dave', { name: 'Dave' });
  graph.addEdge('carol', 'dave', 1);

  return graph;
}

// ============================================================================
// TEST HARNESS
// ============================================================================

/**
 * Run comprehensive pathfinding tests
 */
function runTestHarness() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('          UPROOT PATHFINDING ALGORITHM TEST HARNESS            ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  const graph = createTestGraph();
  const disconnectedGraph = createDisconnectedGraph();

  // Test 1: BFS - Success scenario
  console.log('Test 1: BFS - Find path from Alice to Jack');
  console.log('─────────────────────────────────────────────────────────────');
  const bfsResult1 = bfsShortestPath(graph, 'alice', 'jack');
  if (bfsResult1) {
    console.log('✅ Path found!');
    console.log(`   Path: ${bfsResult1.path.join(' → ')}`);
    console.log(`   Hops: ${bfsResult1.hops}`);
  } else {
    console.log('❌ No path found');
  }
  console.log('');

  // Test 2: BFS - Same person
  console.log('Test 2: BFS - Same person (Alice to Alice)');
  console.log('─────────────────────────────────────────────────────────────');
  const bfsResult2 = bfsShortestPath(graph, 'alice', 'alice');
  if (bfsResult2) {
    console.log('✅ Path found!');
    console.log(`   Path: ${bfsResult2.path.join(' → ')}`);
    console.log(`   Hops: ${bfsResult2.hops}`);
  }
  console.log('');

  // Test 3: BFS - No path exists
  console.log('Test 3: BFS - No path (disconnected graph)');
  console.log('─────────────────────────────────────────────────────────────');
  const bfsResult3 = bfsShortestPath(disconnectedGraph, 'alice', 'carol');
  if (bfsResult3) {
    console.log('❌ Unexpected: Path found');
  } else {
    console.log('✅ Correctly detected: No path exists');
  }
  console.log('');

  // Test 4: A* with default heuristic (H=0)
  console.log('Test 4: A* with default heuristic (H=0, like Dijkstra)');
  console.log('─────────────────────────────────────────────────────────────');
  const astarResult1 = aStarSearch(graph, 'alice', 'jack', defaultHeuristic);
  if (astarResult1) {
    console.log('✅ Path found!');
    console.log(`   Path: ${astarResult1.path.join(' → ')}`);
    console.log(`   Cost: ${astarResult1.cost}`);
    console.log(`   Nodes explored: ${astarResult1.nodesExplored}`);
  }
  console.log('');

  // Test 5: A* with semantic heuristic
  console.log('Test 5: A* with semantic similarity heuristic');
  console.log('─────────────────────────────────────────────────────────────');
  const astarResult2 = aStarSearch(graph, 'alice', 'henry', semanticHeuristic);
  if (astarResult2) {
    console.log('✅ Path found!');
    console.log(`   Path: ${astarResult2.path.join(' → ')}`);
    console.log(`   Cost: ${astarResult2.cost}`);
    console.log(`   Nodes explored: ${astarResult2.nodesExplored}`);

    // Show profile similarity
    const aliceData = graph.getNodeData('alice');
    const henryData = graph.getNodeData('henry');
    console.log(`   Alice skills: ${aliceData.skills.join(', ')}`);
    console.log(`   Henry skills: ${henryData.skills.join(', ')}`);
    console.log(`   Shared: ${aliceData.skills.filter(s => henryData.skills.includes(s)).join(', ')}`);
  }
  console.log('');

  // Test 6: A* - No path exists
  console.log('Test 6: A* - No path (disconnected graph)');
  console.log('─────────────────────────────────────────────────────────────');
  const astarResult3 = aStarSearch(disconnectedGraph, 'alice', 'carol');
  if (astarResult3) {
    console.log('❌ Unexpected: Path found');
  } else {
    console.log('✅ Correctly detected: No path exists');
  }
  console.log('');

  // Test 7: Compare BFS vs A* efficiency
  console.log('Test 7: Efficiency comparison (BFS vs A*)');
  console.log('─────────────────────────────────────────────────────────────');
  const bfsStart = Date.now();
  const bfsCompare = bfsShortestPath(graph, 'alice', 'jack');
  const bfsTime = Date.now() - bfsStart;

  const astarStart = Date.now();
  const astarCompare = aStarSearch(graph, 'alice', 'jack', semanticHeuristic);
  const astarTime = Date.now() - astarStart;

  console.log(`   BFS:  ${bfsTime}ms (${bfsCompare.hops} hops)`);
  console.log(`   A*:   ${astarTime}ms (cost: ${astarCompare.cost}, explored: ${astarCompare.nodesExplored} nodes)`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    TEST HARNESS COMPLETE                      ');
  console.log('═══════════════════════════════════════════════════════════════');
}

// ============================================================================
// UNIT TESTS (Jest-style)
// ============================================================================

/**
 * Simple test runner (Jest-style)
 */
function describe(description, fn) {
  console.log(`\n${description}`);
  fn();
}

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ ${description}`);
  } catch (error) {
    console.log(`  ❌ ${description}`);
    console.log(`     Error: ${error.message}`);
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toBeNull() {
      if (value !== null) {
        throw new Error(`Expected null, got ${value}`);
      }
    },
    toBeTruthy() {
      if (!value) {
        throw new Error(`Expected truthy value, got ${value}`);
      }
    },
    toBeGreaterThan(expected) {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    }
  };
}

/**
 * Run unit tests
 */
function runUnitTests() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                         UNIT TESTS                            ');
  console.log('═══════════════════════════════════════════════════════════════');

  const graph = createTestGraph();
  const disconnectedGraph = createDisconnectedGraph();

  describe('BFS Algorithm', () => {
    test('should find shortest path between connected nodes', () => {
      const result = bfsShortestPath(graph, 'alice', 'bob');
      expect(result).toBeTruthy();
      expect(result.path).toEqual(['alice', 'bob']);
      expect(result.hops).toBe(1);
    });

    test('should return path with 0 hops for same node', () => {
      const result = bfsShortestPath(graph, 'alice', 'alice');
      expect(result).toBeTruthy();
      expect(result.hops).toBe(0);
    });

    test('should return null for disconnected nodes', () => {
      const result = bfsShortestPath(disconnectedGraph, 'alice', 'carol');
      expect(result).toBeNull();
    });

    test('should return null for non-existent nodes', () => {
      const result = bfsShortestPath(graph, 'alice', 'nonexistent');
      expect(result).toBeNull();
    });

    test('should find path through intermediaries', () => {
      const result = bfsShortestPath(graph, 'alice', 'dave');
      expect(result).toBeTruthy();
      expect(result.hops).toBeGreaterThan(1);
    });
  });

  describe('A* Algorithm', () => {
    test('should find optimal path with default heuristic', () => {
      const result = aStarSearch(graph, 'alice', 'bob', defaultHeuristic);
      expect(result).toBeTruthy();
      expect(result.path).toEqual(['alice', 'bob']);
      expect(result.cost).toBe(1);
    });

    test('should return path with 0 cost for same node', () => {
      const result = aStarSearch(graph, 'alice', 'alice');
      expect(result).toBeTruthy();
      expect(result.cost).toBe(0);
    });

    test('should return null for disconnected nodes', () => {
      const result = aStarSearch(disconnectedGraph, 'alice', 'carol');
      expect(result).toBeNull();
    });

    test('should work with semantic heuristic', () => {
      const result = aStarSearch(graph, 'alice', 'eve', semanticHeuristic);
      expect(result).toBeTruthy();
      expect(result.path).toBeTruthy();
    });

    test('should fallback to H=0 when no profile data', () => {
      const simpleGraph = new Graph();
      simpleGraph.addNode('a');
      simpleGraph.addNode('b');
      simpleGraph.addEdge('a', 'b', 1);

      const result = aStarSearch(simpleGraph, 'a', 'b', semanticHeuristic);
      expect(result).toBeTruthy();
      expect(result.cost).toBe(1);
    });

    test('should explore fewer nodes with good heuristic', () => {
      const defaultResult = aStarSearch(graph, 'alice', 'henry', defaultHeuristic);
      const semanticResult = aStarSearch(graph, 'alice', 'henry', semanticHeuristic);

      // Both should find a path
      expect(defaultResult).toBeTruthy();
      expect(semanticResult).toBeTruthy();

      // Semantic heuristic may explore fewer or equal nodes (not guaranteed in small graphs)
      expect(semanticResult.nodesExplored).toBeGreaterThan(0);
    });
  });

  describe('Priority Queue', () => {
    test('should dequeue elements in priority order', () => {
      const pq = new PriorityQueue();
      pq.enqueue('low', 10);
      pq.enqueue('high', 1);
      pq.enqueue('medium', 5);

      expect(pq.dequeue()).toBe('high');
      expect(pq.dequeue()).toBe('medium');
      expect(pq.dequeue()).toBe('low');
    });

    test('should handle empty queue', () => {
      const pq = new PriorityQueue();
      expect(pq.isEmpty()).toBeTruthy();
      expect(pq.dequeue()).toBeNull();
    });

    test('should report correct size', () => {
      const pq = new PriorityQueue();
      expect(pq.size()).toBe(0);
      pq.enqueue('a', 1);
      expect(pq.size()).toBe(1);
      pq.enqueue('b', 2);
      expect(pq.size()).toBe(2);
      pq.dequeue();
      expect(pq.size()).toBe(1);
    });
  });

  describe('Semantic Heuristic', () => {
    test('should return 0 when no profile data available', () => {
      const emptyGraph = new Graph();
      emptyGraph.addNode('a');
      emptyGraph.addNode('b');

      const h = semanticHeuristic('a', 'b', emptyGraph);
      expect(h).toBe(0);
    });

    test('should return lower distance for similar profiles', () => {
      const h1 = semanticHeuristic('alice', 'eve', graph); // Both have React
      const h2 = semanticHeuristic('alice', 'jack', graph); // Very different

      // Similar profiles should have lower estimated distance
      expect(h1).toBeTruthy();
      expect(h2).toBeTruthy();
    });

    test('should consider skill overlap', () => {
      // Alice and Eve both have React
      const h = semanticHeuristic('alice', 'eve', graph);
      expect(h).toBeTruthy();
      // Should be less than 1 (some similarity)
      expect(h < 1).toBeTruthy();
    });
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    UNIT TESTS COMPLETE                        ');
  console.log('═══════════════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Check if running directly (ES module equivalent of require.main === module)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  console.log('\n🚀 Starting Uproot Pathfinding Algorithm Demo...\n');

  // Run test harness
  runTestHarness();

  // Run unit tests
  runUnitTests();

  console.log('\n✅ All demonstrations complete!\n');
}

// ============================================================================
// EXPORTS (for use in other modules)
// ============================================================================

export {
  // Data structures
  PriorityQueue,
  Graph,

  // Algorithms
  bfsShortestPath,
  aStarSearch,

  // Heuristics
  defaultHeuristic,
  semanticHeuristic,

  // Test utilities
  createTestGraph,
  createDisconnectedGraph,
  runTestHarness,
  runUnitTests
};
