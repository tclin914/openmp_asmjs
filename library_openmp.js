var LibraryOpenMP = {
  
  _omp_barrier_address: '; if (!ENVIRONMENT_IS_PTHREAD) __omp_barrier_address = allocate(1, "*i32", ALLOC_STATIC)',
  
  $OpenMP__deps: ['_omp_barrier_address'],
  $OpenMP: {
  	omp_num_threads: 4,
    omp_barrier_address: 0,
    unusedWorkerPool: [],
    runningWorkers: [],
    initMainThreadBlock: function() {
      if (ENVIRONMENT_IS_PTHREAD) return undefined;
      var threadInfoStruct = _malloc(216);
      for (var i = 0; i < 216 >> 2; ++i) HEAPU32[(threadInfoStruct >> 2) + i] = 0;
    
      // set up thread infomation
      Atomics.store(HEAPU32, (threadInfoStruct + 0) >> 2, 0); // threadId
      Atomics.store(HEAPU32, (threadInfoStruct + 4) >> 2, 0); // threadStatus
      Atomics.store(HEAPU32, (threadInfoStruct + 8) >> 2, 0); // threadExitCode

      OpenMP.mainThreadBlock = threadInfoStruct; 
    },
    threads: {},
    threadIdCounter: 2,
    allocateUnusedWorkers: function(numWorkers, onFinishedLoading) {
      if (typeof SharedArrayBuffer === 'undefined') return;
      Module['print']('Preallocating ' + numWorkers + ' workers for a pthread spawn pool.');

      var numWorkersLoaded = 0;
      for (var i = 0; i < numWorkers; ++i) {
        // var threadMainJS = '../thread-main.js';
        var threadMainJS = 'file:///Users/tclin/openmp_asmjs/thread-main.js';
        
        // if (typeof Module['locateFile'] === 'function') threadMainJS = Module['locateFile'](threadMainJS);
        
        var worker = new Worker(threadMainJS);
        worker.onmessage = function(e) {
          if (e.data.cmd === 'processQueuedMainThreadWork') {
            _emscripten_main_thread_process_queued_calls();
          } else 
              if (e.data.cmd === 'spawnThread') {
            __spawn_thread(e.data);
          } else if (e.data.cmd === 'spawnThread') {
            __spawn_thread(e.data);
          } else if (e.data.cmd === 'cleanupThread') {
            __cleanup_thread(e.data.thread);
          } else if (e.data.cmd === 'killThread') {
            __kill_thread(e.data.thread);
          } else if (e.data.cmd === 'cancelThread') {
            __cancel_thread(e.data.thread);
          } else if (e.data.cmd === 'loaded') {
            ++numWorkersLoaded;
            if (numWorkersLoaded === numWorkers && onFinishedLoading) {
              onFinishedLoading();
            }
          } else if (e.data.cmd === 'print') {
            Module['print']('Thread ' + e.data.threadId + ': ' + e.data.text);
          } else if (e.data.cmd === 'printErr') {
            Module['printErr']('Thread ' + e.data.threadId + ': ' + e.data.text);
          } else if (e.data.cmd === 'exit') {
            // todo 
          } else if (e.data.cmd === 'cancelDone') {
              PThread.freeThreadData(worker.pthread);
              worker.pthread = undefined; // Detach the worker from the pthread object, and return it to the worker pool as an unused worker.
              PThread.unusedWorkerPool.push(worker);
              // TODO: Free if detached.
              PThread.runningWorkers.splice(PThread.runningWorkers.indexOf(worker.pthread), 1); // Not a running Worker anymore.
          } else {
            Module['printErr']("worker sent an unknown command " + e.data.cmd);
          }
        
        };

        worker.onerror = function(e) {
          Module['printErr']('thread sent an error! ' + e.message);
        };

        var tempDoublePtr = getMemory(8);

        worker.postMessage({
          cmd: 'load',
          url: currentScriptUrl,
          buffer: HEAPU8.buffer,
          tempDoublePtr: tempDoublePtr,
          PthreadWorkerInit: PthreadWorkerInit
          }, [HEAPU8.buffer]
        );
        
        OpenMP.unusedWorkerPool.push(worker);
      }
    },

    threadExit: function() {
      Atomics.store(HEAPU32, (threadInfoStruct + 4) >> 2, 1); // threadStatus
      __omp_futex_wake(threadInfoStruct, 1);
    },

    getNewWorker: function() {
      if (OpenMP.unusedWorkerPool.length == 0) OpenMP.allocateUnusedWorkers(1);
      if (OpenMP.unusedWorkerPool.length > 0) return OpenMP.unusedWorkerPool.pop();
      else return null;
    },

    busySpinWait: function(msecs) {
      var t = performance.now() + msecs;
      while(performance.now() < t) {
        ;
      }
    }
  },

  _omp_spawn_thread: function(threadId, threadParams, argc, varargs) {
    if (ENVIRONMENT_IS_WORKER || ENVIRONMENT_IS_PTHREAD) throw 'Internal Error! _spawn_thread() can only ever be called from main JS thread!';

    var worker = OpenMP.getNewWorker();
    if (worker.pthread !== undefined) throw 'Internal error!';
    if (!threadParams.thread_ptr) throw 'Internal error, no thread ptr!';
    OpenMP.runningWorkers.push(worker);

    var thread = OpenMP.threads[threadParams.thread_ptr] = {
      worker: worker,
      stackBase: threadParams.stackBase,
      stackSize: threadParams.stackSize,
      threadInfoStruct: threadParams.thread_ptr
    };

    // set up thread infomation
    Atomics.store(HEAPU32, (thread.threadInfoStruct + 0) >> 2, threadId); // threadId
    Atomics.store(HEAPU32, (thread.threadInfoStruct + 4) >> 2, 0); // threadStatus
    Atomics.store(HEAPU32, (thread.threadInfoStruct + 8) >> 2, 0); // threadExitCode

    worker.thread = thread;

    worker.postMessage({
      cmd: 'run',
      microtask: threadParams.microtask,
      argc: argc, 
      varargs: varargs,
      threadInfoStruct: threadParams.thread_ptr,
      selfThreadId: threadId,
      stackBase: threadParams.stackBase,
      stackSize: threadParams.stackSize,
      omp_num_threads: OpenMP.omp_num_threads,
      omp_barrier_address: OpenMP.omp_barrier_address
    });

  },

  _omp_thread_create__deps: ['_omp_spawn_thread'],
  _omp_thread_create: function(threadId, argc, microtask, varargs) {
    if (typeof SharedArrayBuffer === 'undefined') {
      Module['printErr']('Current envrionment does not support SharedArrayBuffer, OpenMP are not availalbe!');
      return 11;
    }
  
    var stackSize = 0;
    var stackBase = 0;

    stackSize += 81920;
    stackBase = _malloc(stackSize);

    var threadInfoStruct = _malloc(216);
    for (var i = 0; i < 216 >> 2; ++i) HEAPU32[(threadInfoStruct >> 2) + i] = 0;

    var threadParams = {
      stackBase: stackBase,
      stackSize: stackSize,
      microtask: microtask,
      thread_ptr: threadInfoStruct
    };

    if (ENVIRONMENT_IS_WORKER) {
      threadParams.cmd = 'spawnThread';
      postMessage(threadParams);
    } else {
      __omp_spawn_thread(threadId, threadParams, argc, varargs); 
      return threadInfoStruct;
    }
  },

  _omp_thread_join: function(thread_ptr) {
    for (;;) {
      var threadStatus = Atomics.load(HEAPU32, (thread_ptr + 4) >> 2);
      if (threadStatus == 1) {
        console.log('_omp_thread_join return');
        return; 
      }
      // if (!ENVIRONMENT_IS_PTHREAD) _emscripten_main_thread_process_queued_calls();
      __omp_futex_wait(thread_ptr + 4, threadStatus, 100);
    } 
  },

  _omp_futex_wait: function(addr, val, timeout) {
    if (addr <= 0 || addr > HEAP8.length || addr&3 != 0) {
      console.log('Error: __omp_futex_wait abnomal wait address ' + addr + ' threadId = ' + selfThreadId);
    }

    if (ENVIRONMENT_IS_WORKER) {
      var ret = Atomics.futexWait(HEAP32, addr >> 2, val, timeout);
      if (ret == Atomics.TIMEOUT) return -2;
      if (ret == Atomics.NOTEQUAL) return -1;
      if (ret == 0) return 0;
    } else {
      // main thread waiting
      var loadedVal = Atomics.load(HEAP32, addr >> 2);
      if (loadedVal != val) {
        console.log('Error: __omp_futex_wait loadedVal != val');    
      }
      var tNow = performance.now();
      var tEnd = tNow + timeout;

      Atomics.store(HEAP32, __main_thread_futex_wait_address >> 2, addr);
      while (addr) {
        tNow = performance.now();
        if (tNow > tEnd) {
          return -110;
        }
        addr = Atomics.load(HEAP32, __main_thread_futex_wait_address >> 2);
      }
      return 0;
    }
  },

  _omp_futex_wake: function(addr, count) {
    // wake up main thread
    var mainThreadWaitAddress = Atomics.load(HEAP32, __main_thread_futex_wait_address >> 2);
    var mainThreadWoken = 0;
    if (mainThreadWaitAddress == addr) {
      var loadedAddr = Atomics.compareExchange(HEAP32, __main_thread_futex_wait_address >> 2, mainThreadWaitAddress, 0);
      if (loadedAddr == mainThreadWaitAddress) {
        --count;   
        mainThreadWoken = 1;
        if (count <= 0) return 1;
      }
    }
  },

  omp_set_num_threads: function(num_threads) {
    OpenMP.omp_num_threads = num_threads;
  },

  omp_get_num_threads: function() {
  	return OpenMP.omp_num_threads;
  },

  omp_get_thread_num: function() {
    if (!ENVIRONMENT_IS_PTHREAD) return 0;
    return selfThreadId;
  },

  __kmpc_fork_call__deps: ['_omp_thread_create', '_omp_thread_join', '_omp_futex_wait', '_omp_futex_wake'],
  __kmpc_fork_call: function(loc, argc, microtask, varargs) {
    if (OpenMP.mainThreadBlock === undefined) {
      OpenMP.initMainThreadBlock(); 
    }
    if (OpenMP.omp_barrier_address == 0) {
      OpenMP.omp_barrier_address = __omp_barrier_address;
    }
    HEAP32[OpenMP.omp_barrier_addr >> 2] = 0;
    var thread_ptrs = [];
    for (var i = 0; i < OpenMP.omp_num_threads - 1; i++) {
      var thread_ptr = __omp_thread_create(i + 1, argc, microtask, varargs);
      thread_ptrs.push(thread_ptr);
    }
    // main thread execution
    try {
      switch (argc) {
        case 0:
          asm.dynCall_vii(microtask, OpenMP.mainThreadBlock + 0, 1);
          break;
        case 1:
          asm.dynCall_viii(microtask, OpenMP.mainThreadBlock + 0, 1, HEAP32[varargs >> 2]);
          break;
        case 2:
          asm.dynCall_viiii(microtask, OpenMP.mainThreadBlock + 0, 1, HEAP32[varargs >> 2], HEAP32[(varargs + 4) >> 2]);
          break
        default: 
        }
    } catch (e) {
        console.log('Exception: ' + e);
    }

    for (var i = 0; i < OpenMP.omp_num_threads - 1; i++)
      __omp_thread_join(thread_ptrs.pop());

  },

  __kmpc_barrier: function(loc, threadId) {
    // load the number of the thread arriving barrier
    Atomics.add(HEAP32, OpenMP.omp_barrier_address >> 2, 1);
    for (;;) {
      var num = Atomics.load(HEAP32, OpenMP.omp_barrier_address >> 2);
      if (num == OpenMP.omp_num_threads) {
        return;
       }
       __omp_futex_wait(OpenMP.omp_barrier_address, num, 100);
    }
  },

  // TODO:
  __kmpc_critical: function(loc, threadId, crit) {
  
  },

  // TODO:
  __kmpc_end_critical: function(loc, threadId, crit) {
  
  },

  __kmpc_master: function(loc, threadId) {
    if (threadId == 0) return 1;
    return 0;
  },

  // TODO:
  __kmpc_end_master: function(loc, threadId) {
  
  }
};

autoAddDeps(LibraryOpenMP, '$OpenMP');
mergeInto(LibraryManager.library, LibraryOpenMP);
