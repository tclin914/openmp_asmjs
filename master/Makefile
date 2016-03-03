
All: master.html llvm

master.html: master.c ../library_openmp.js
	emcc -fopenmp -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=5 master.c -o master.html -I ../../llvm/llvm-build/projects/openmp/runtime/src --js-library ../library_openmp.js

llvm: master.ll

master.ll: master.c
	emcc -fopenmp -s USE_PTHREADS=1 master.c -S -c -o master.ll -I ../../llvm/llvm-build/projects/openmp/runtime/src

clean: 
	rm master.html
	rm master.js
	rm pthread-main.js
	rm master.ll
