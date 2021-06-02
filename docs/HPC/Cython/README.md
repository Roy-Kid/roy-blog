---
title: 第零章- Cython简介
date: 2021-06-02
categories:
 - HPC
tags:
 - Cython
sidebar: 'auto'
---

Cython 是什么, 一言以蔽之, 就是带有C语言数据类型的Python

Cython is an optimising static compiler for both the Python programming language and the extended Cython programming language (based on Pyrex). It makes writing C extensions for Python as easy as Python itself.

Cython gives you the combined power of Python and C to let you

write Python code that calls back and forth from and to C or C++ code natively at any point.
easily tune readable Python code into plain C performance by adding static type declarations, also in Python syntax.
use combined source code level debugging to find bugs in your Python, Cython and C code.
interact efficiently with large data sets, e.g. using multi-dimensional NumPy arrays.
quickly build your applications within the large, mature and widely used CPython ecosystem.
integrate natively with existing code and data from legacy, low-level or high-performance libraries and applications.
The Cython language is a superset of the Python language that additionally supports calling C functions and declaring C types on variables and class attributes. This allows the compiler to generate very efficient C code from Cython code. The C code is generated once and then compiles with all major C/C++ compilers in CPython 2.6, 2.7 (2.4+ with Cython 0.20.x) as well as 3.3 and all later versions. We regularly run integration tests against all supported CPython versions and their latest in-development branches to make sure that the generated code stays widely compatible and well adapted to each version. PyPy support is work in progress (on both sides) and is considered mostly usable since Cython 0.17. The latest PyPy version is always recommended here.

All of this makes Cython the ideal language for wrapping external C libraries, embedding CPython into existing applications, and for fast C modules that speed up the execution of Python code.

:::tip
Cython 是这个专栏的主角, 而Cpython是我们用的Python解释器
:::

Cython就是python: 所有的Python代码都是Cython代码. Cython把它转换为C语言, 相当于是调用了Python/C API, 也就是说, 你可以拿Python的语法去写C. 

所有的数据类型都可以自由混合, 转换都是自动进行. 错误检查也是自动的, Python的异常处理工具可以完成所有的功能, 即使是在操作C代码的时候也是如此

如是我闻, Cython不一定有C快, 但一定比你写的C快.
