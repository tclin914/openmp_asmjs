#include <omp.h>
#include <stdio.h>

#define toss 4000000

int main() {
    omp_set_num_threads(4);
    int in_circle_sum = 0;
    int in_circle[4] = { 0 };
#pragma omp parallel
    {
      for (int i = 0; i < toss / omp_get_num_threads(); i++) {
        double x = rand() / (double)RAND_MAX;  
        double y = rand() / (double)RAND_MAX;
        double result = (x * x) + (y * y);
        
        if (result < 1) {
          in_circle[omp_get_thread_num()] += 1;
        }
      }
#pragma omp critical 
      in_circle_sum += in_circle[omp_get_thread_num()];
    }
    for (int i = 0; i < 4; i++) {
      printf("in_circle[%d] = %d\n", i, in_circle[i]);
    }
    printf("in_circle_sum = %d\n", in_circle_sum);
    printf("pi = %.15Lf", 4 * (in_circle_sum / (long double)toss));
}
