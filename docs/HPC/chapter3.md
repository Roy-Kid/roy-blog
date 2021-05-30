---
title: 第三章- 六个接口构成的MPI子集
date: 2021-05-30
categories:
 - HPC
tags:
 - MPI
sidebar: 'auto'
---

## MPI调用的参数说明

MPI-2中有287个接口, 应该说MPI是比较庞大的, 完全掌握这么多的调用对于初学者来说是比较困难的.但是, 从理论上说 MPI所有的通信功能可以用它的6个基本的调用来实现. 掌握了这6个调用, 就可以实现所有的消息传递并行程序
的功能. 

对于有参数的MPI调用, MPI首先给出一种独立于具体语言的说明, 对各
个参数的性质进行介绍, 然后在给出它相对于FORTRAN77和C的原型说明. 在MPI-2中还
给出了C++形式的说明. MPI对参数说明的方式有三种, 分别是`IN`, `OUT`和`INOUT`. 它们的
含义分别是:

* IN 输入: 调用部分传递给MPI的参数, MPI除了使用该参数外不允许对这一参
数做任何修改;
* OUT 输出: MPI返回给调用部分的结果参数, 该参数的初始值对MPI没有任何
意义;
* INOUT 输入输出: 调用部分首先将该参数传递给MPI, MPI对这一参数引用
修改后, 将结果返回给外部调用. 该参数的初始值和返回结果都有意义.

如果某一个参数在调用前后没有改变, 比如某个隐含对象的句柄, 但是该句柄指向的对
象被修改了, 这一参数仍然被说明为`OUT`或`INOUT`. MPI的定义在最大范围内避免`INOUT`
参数的使用, 因为这些使用易于出错, 特别是对标量参数.

还有一种情况是MPI 函数的一个参数被一些并行执行的进程用作`IN`, 而被另一些同时
执行的进程用作`OUT`. 虽然在语义上它不是同一个调用的输入和输出, 这样的参数语法上
也记为`INOUT`.

::: tip
当一个MPI参数仅对一些并行执行的进程有意义而对其它的进程没有意义时 不关心该
参数取值的进程可以将任意的值传递给该参数
:::

在MPI中`OUT`或`INOUT`类型的参数不能被其它的参数作为别名使用. 如下定义一个 C 过
程:

```c
void copyIntBuffer( int *pin, int *pout, int len ) {
    int i;
    for (i=0; i<len; ++i) *pout++ = *pin++;
}

int a[10];
copyIntBuffer( a, a+3, 7);
```

这个函数的调用使用了参数别名. 虽然 C 语言中允许这样, 但除非特别说明, MPI调用禁止这样使用, FORTRAN77是禁
止使用别名参数的.

对于`mpi4py`, 由于没有传址引用这个概念, 则没有`OUT`/`INOUT`类型的参数. `OUT`的实现采用的是函数返回值的形式. 正如在《hello world, MPI》中展现的那样, c的`rank`和`size`是将其指针传入函数. python没有这一概念, 因此传入的是变量的值, 然后通过函数返回值的形式得到out. 

再者, `mpi4py`桥接了python和C语言, 因此需要照顾两种编程思路, 所以同一个MPI函数会有很多种表达和调用形式. 在名称上仅有微弱的区分, 在后面会加以强调.

之后的调用声明中, 首先给出的是MPI不依赖于语言的说明, 然后给出这个调用的C版本, 最后给出`mpi4py`形式. 

## 六个常用接口

### MPI初始化

```
MPI_INIT() 

int MPI_INIT(int *argc, char ***argv)

comm = MPI.COMM_WORLD

```

### MPI结束

```
MPI_FINALIZE()

int MPI_Finalize(void)

None
```

### 当前进程标识

```
MPI_COMM_RANK(comm,rank)
IN comm 该进程所在的通信域 句柄
OUT rank 调用进程在comm中的标识号

int MPI_Comm_rank(MPI_Comm comm, int *rank)

rank = comm.Get_rank()
```

### 通信域包含的进程数

```
MPI_COMM_SIZE(comm,size)
IN comm 通信域 句柄
OUT size 通信域comm内包括的进程数(整数)

int MPI_Comm_size(MPI_Comm comm, int *size)

size = comm.Get_size()
```
### 消息发送

```
MPI_SEND(buf,count,datatype,dest,tag,comm)
IN buf 发送缓冲区的起始地址(可选类型)
IN count 将发送的数据的个数(非负整数)
IN datatype 发送数据的数据类型(句柄)
IN dest 目的进程标识号(整型)
IN tag 消息标志(整型)
IN comm 通信域(句柄)

int MPI_Send(void* buf, int count, MPI_Datatype datatype, int dest, int tag, MPI_Comm
comm)

# src/mpi4py/MPI.pyi

comm.send(self, obj: Any, dest: int, tag: int = 0) -> None: ...

comm.isend(self, obj: Any, dest: int, tag: int = 0) -> Request: ...

comm.Send(self, buf: BufSpec, dest: int, tag: int = 0) -> None: ...

```


### 消息接收

```
MPI_RECV(buf,count,datatype,source,tag,comm,status)
OUT buf 接收缓冲区的起始地址(可选数据类型)
IN count 最多可接收的数据的个数(整型)
IN datatype 接收数据的数据类型(句柄)
IN source 接收数据的来源即发送数据的进程的进程标识号(整型)
IN tag 消息标识 与相应的发送操作的表示相匹配相同(整型)
IN comm 本进程和发送进程所在的通信域(句柄)
OUT status 返回状态 (状态类型)

int MPI_Recv(void* buf, int count, MPI_Datatype datatype, int source, int tag,
MPI_Comm comm, MPI_Status *status)

# src/mpi4py/MPI.pyi

comm.recv(self, buf: Optional[Buffer] = None, source: int = ANY_SOURCE, tag: int = ANY_TAG, status: Optional[Status] = None) -> Any: ...

comm.irecv(self, buf: Optional[Buffer] = None, source: int = ANY_SOURCE, tag: int = ANY_TAG) -> Request: ...

comm.Recv(self, buf: BufSpec, source: int = ANY_SOURCE, tag: int = ANY_TAG, status: Optional[Status] = None) -> None: ...

```

### 返回状态status

```
MPI_Status status;

    status.MPI_SOURCE
    status.MPI_TAG
    status.MPI_ERROR

status = MPI.Status()
    
    status.source
    status.tag
    status.error

```
我们将在接下来的教程中详细介绍使用方法和具体含义. 
