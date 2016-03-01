#include <omp.h>
#include <stdio.h>

int main() {
    omp_set_num_threads(4);
    int val[4] = { 0 };
#pragma omp parallel
    {
        val[omp_get_thread_num()] = 1;
    }
    // test thread executing result
    for (int i = 0; i < 4; i++) {
        if (val[i] == 1) {
            printf("thread %d done\n", i);
        }
    }
    return 0;
}

