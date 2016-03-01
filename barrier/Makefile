
All: barrier.html 

barrier.html: barrier.c
	emcc -fopenmp -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=5 barrier.c -o barrier.html -I ../../llvm/llvm-build/projects/openmp/runtime/src --js-library ../library_openmp.js

llvm: barrier.ll

barrier.ll: barrier.c
	emcc -fopenmp -s USE_PTHREADS=1 barrier.c -S -c -o barrier.ll -I ../../llvm/llvm-build/projects/openmp/runtime/src

clean:
	rm barrier.html
	rm barrier.js
	rm pthread-main.js
	rm barrier.ll

