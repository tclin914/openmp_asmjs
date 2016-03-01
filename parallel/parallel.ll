; ModuleID = 'parallel.c'
target datalayout = "e-p:32:32-i64:64-v128:32:128-n32-S128"
target triple = "asmjs-unknown-emscripten"

%ident_t = type { i32, i32, i32, i32, i8* }

@.str = private unnamed_addr constant [23 x i8] c";unknown;unknown;0;0;;\00", align 1
@0 = private unnamed_addr constant %ident_t { i32 0, i32 2, i32 0, i32 0, i8* getelementptr inbounds ([23 x i8], [23 x i8]* @.str, i32 0, i32 0) }, align 4
@.str.1 = private unnamed_addr constant [15 x i8] c"thread %d done\00", align 1

; Function Attrs: nounwind
define i32 @main() #0 {
  %1 = alloca i32, align 4
  %val = alloca [4 x i32], align 4
  %i = alloca i32, align 4
  store i32 0, i32* %1, align 4
  call void @omp_set_num_threads(i32 4)
  %2 = bitcast [4 x i32]* %val to i8*
  call void @llvm.memset.p0i8.i32(i8* %2, i8 0, i32 16, i32 4, i1 false)
  call void (%ident_t*, i32, void (i32*, i32*, ...)*, ...) @__kmpc_fork_call(%ident_t* @0, i32 1, void (i32*, i32*, ...)* bitcast (void (i32*, i32*, [4 x i32]*)* @.omp_outlined. to void (i32*, i32*, ...)*), [4 x i32]* %val)
  store i32 0, i32* %i, align 4
  br label %3

; <label>:3                                       ; preds = %15, %0
  %4 = load i32, i32* %i, align 4
  %5 = icmp slt i32 %4, 4
  br i1 %5, label %6, label %18

; <label>:6                                       ; preds = %3
  %7 = load i32, i32* %i, align 4
  %8 = getelementptr inbounds [4 x i32], [4 x i32]* %val, i32 0, i32 %7
  %9 = load i32, i32* %8, align 4
  %10 = icmp eq i32 %9, 1
  br i1 %10, label %11, label %14

; <label>:11                                      ; preds = %6
  %12 = load i32, i32* %i, align 4
  %13 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @.str.1, i32 0, i32 0), i32 %12)
  br label %14

; <label>:14                                      ; preds = %11, %6
  br label %15

; <label>:15                                      ; preds = %14
  %16 = load i32, i32* %i, align 4
  %17 = add nsw i32 %16, 1
  store i32 %17, i32* %i, align 4
  br label %3

; <label>:18                                      ; preds = %3
  ret i32 0
}

declare void @omp_set_num_threads(i32) #1

; Function Attrs: argmemonly nounwind
declare void @llvm.memset.p0i8.i32(i8* nocapture, i8, i32, i32, i1) #2

; Function Attrs: nounwind
define internal void @.omp_outlined.(i32* noalias %.global_tid., i32* noalias %.bound_tid., [4 x i32]* dereferenceable(16) %val) #0 {
  %1 = alloca i32*, align 4
  %2 = alloca i32*, align 4
  %3 = alloca [4 x i32]*, align 4
  store i32* %.global_tid., i32** %1, align 4
  store i32* %.bound_tid., i32** %2, align 4
  store [4 x i32]* %val, [4 x i32]** %3, align 4
  %4 = load [4 x i32]*, [4 x i32]** %3, align 4
  %5 = call i32 @omp_get_thread_num()
  %6 = getelementptr inbounds [4 x i32], [4 x i32]* %4, i32 0, i32 %5
  store i32 1, i32* %6, align 4
  ret void
}

declare i32 @omp_get_thread_num() #1

declare void @__kmpc_fork_call(%ident_t*, i32, void (i32*, i32*, ...)*, ...)

declare i32 @printf(i8*, ...) #1

attributes #0 = { nounwind "disable-tail-calls"="false" "less-precise-fpmad"="false" "no-frame-pointer-elim"="true" "no-frame-pointer-elim-non-leaf" "no-infs-fp-math"="false" "no-nans-fp-math"="false" "stack-protector-buffer-size"="8" "unsafe-fp-math"="false" "use-soft-float"="false" }
attributes #1 = { "disable-tail-calls"="false" "less-precise-fpmad"="false" "no-frame-pointer-elim"="true" "no-frame-pointer-elim-non-leaf" "no-infs-fp-math"="false" "no-nans-fp-math"="false" "stack-protector-buffer-size"="8" "unsafe-fp-math"="false" "use-soft-float"="false" }
attributes #2 = { argmemonly nounwind }

!llvm.ident = !{!0}

!0 = !{!"clang version 3.9.0 (https://github.com/kripken/emscripten-fastcomp-clang/ fbda8e64b12828268335dbae7e16a305569da223) (https://github.com/kripken/emscripten-fastcomp/ ceb6513838bfdcb2ed6830e765d5f3420f7dde76) (emscripten 1.35.23 : 1.35.23)"}
