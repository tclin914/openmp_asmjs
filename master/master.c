#include <omp.h>
#include <stdio.h>

int main() {
    omp_set_num_threads(4);
    int val[4] = { 0 };
    int sum = 0;
#pragma omp parallel
    {
        val[omp_get_thread_num()] = omp_get_thread_num();
#pragma omp barrier
#pragma omp master
        val[omp_get_thread_num()] = val[0] + val[1] + val[2] + val[3];
    }
    for (int i = 0; i < 4; i++) {
      printf("val[%d] = %d\n", i, val[i]);
    }
    if (val[0] == 6 && val[1] == 1 && val[2] == 2 && val[3] == 3) {
        printf("answer correct\n");
    }
}
