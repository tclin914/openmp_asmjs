#include <omp.h>
#include <stdio.h>

int main() {
    omp_set_num_threads(4);
    int count = 0;
#pragma omp parallel
    {
#pragma omp atomic
        count++;
    }
    if (count == 4) {
        printf("answer correct\n");
    }
}
