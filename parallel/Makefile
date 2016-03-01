
All: parallel.html

parallel.html: parallel.c
	emcc -fopenmp -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=5 parallel.c -o parallel.html -I ../../llvm/llvm-build/projects/openmp/runtime/src --js-library ../library_openmp.js

llvm: parallel.ll

parallel.ll: parallel.c
	emcc -fopenmp -s USE_PTHREADS=1 parallel.c -S -c -o parallel.ll -I ../../llvm/llvm-build/projects/openmp/runtime/src

clean:
	rm parallel.html
	rm parallel.js
	rm pthread-main.js
	rm parallel.ll
