
var buffer;

var threadInfoStruct = 0;

var selfThreadId = 0;

var tempDoublePtr = 0; // A temporary memory area for global float and double marshalling operations.

//Each thread has its own allocated stack space
var STACK_BASE = 0;
var STACKTOP = 0;
var STACK_MAX = 0;

var ENVIRONMENT_IS_PTHREAD = true;

var Module = {};

function threadPrint() {
  var text = Array.prototype.slice.call(arguments).join(' ');
  postMessage({cmd: 'print', text: text, threadId: selfThreadId});
}

function threadPrintErr() {
  var text = Array.prototype.slice.call(arguments).join(' ');
  postMessage({cmd: 'printErr', text: text, threadId: selfThreadId});
}

Module['print'] = threadPrint;
Module['printErr'] = threadPrintErr;

cosole = {
  log: threadPrint,
  error: threadPrintErr
};

this.onmessage = function(e) {
  if (e.data.cmd === 'load') {
      buffer = e.data.buffer;
      tempDoublePtr = e.data.tempDoublePtr;
      PthreadWorkerInit = e.data.PthreadWorkerInit;
      importScripts(e.data.url);
      FS.createStandardStreams();
      postMessage({cmd: 'loaded'});
  } else if (e.data.cmd === 'run') {
      threadInfoStruct = e.data.threadInfoStruct;
      assert(threadInfoStruct);
      selfThreadId = e.data.selfThreadId;

      STACK_BASE = STACKTOP = e.data.stackBase;
      STACK_MAX = STACK_BASE + e.data.stackSize;
      assert(STACK_BASE != 0);
      assert(STACK_MAX > STACK_BASE);
      Runtime.establishStackSpace(e.data.stackBase, e.data.stackBase + e.data.stackSize);

      // OpenMP setting
      OpenMP.omp_num_threads = e.data.omp_num_threads;
      OpenMP.omp_barrier_address = e.data.omp_barrier_address;

      try {
        switch (e.data.argc) {
            case 0:
              asm.dynCall_vii(e.data.microtask, selfThreadId, 1);          
              break;
            case 1:
              asm.dynCall_viii(e.data.microtask, selfThreadId, 1, HEAP32[e.data.varargs >> 2]);
              break; 
            default:
                
        }
      } catch (e) {
          console.log('Exception: ' + e);
      }
      OpenMP.threadExit();
  
  } else {
    Module['printErr']('thread-main.js received unknown command ' + e.data.cmd);
  }
}
