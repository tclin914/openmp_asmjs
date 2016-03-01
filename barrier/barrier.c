#include <omp.h>
#include <stdio.h>

int main() {
    omp_set_num_threads(4);
    int val[8] = { 0 };
#pragma omp parallel
    {
        val[omp_get_thread_num()] = omp_get_thread_num() + 1;   
#pragma omp barrier
        val[omp_get_thread_num() + 4] = val[omp_get_thread_num()] +
            val[(omp_get_thread_num() + 1) % omp_get_num_threads()];
    }

    if (val[4] == 3) {
        printf("thread 0 done\n");
    }
    if (val[5] == 5) {
        printf("thread 1 done\n");
    }
    if (val[6] == 7) {
        printf("thread 2 done\n");
    }
    if (val[7] == 5) {
        printf("thread 3 done\n");
    }
}
