
All: atomic.html

atomic.html: atomic.c ../library_openmp.js
	emcc -fopenmp -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=5 atomic.c -o atomic.html -I ../../llvm/llvm-build/projects/openmp/runtime/src --js-library ../library_openmp.js

llvm: atomic.ll

atomic.ll: atomic.c
	emcc -fopenmp -s USE_PTHREADS=1 atomic.c -S -c -o atomic.ll -I ../../llvm/llvm-build/projects/openmp/runtime/src

clean: 
	rm atomic.html
	rm atomic.js
	rm pthread-main.js
	rm atomic.ll
