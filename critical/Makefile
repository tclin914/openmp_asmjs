
All: critical.html llvm

critical.html: critical.c ../library_openmp.js
	emcc -fopenmp -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=5 critical.c -o critical.html -I ../../llvm/llvm-build/projects/openmp/runtime/src --js-library ../library_openmp.js

llvm: critical.ll

critical.ll: critical.c
	emcc -fopenmp -s USE_PTHREADS=1 critical.c -S -c -o critical.ll -I ../../llvm/llvm-build/projects/openmp/runtime/src

clean:
	rm critical.html
	rm critical.js
	rm pthread-main.js
	rm critical.ll
