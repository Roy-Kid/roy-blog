---
title: 第二章- 调用C函数
date: 2021-06-02
categories:
 - HPC
tags:
 - Cython
sidebar: 'auto'
---

假如说你需要用把`char*`转换为`int`, 这时候需要`stdlib.h`中的`atoi()`

```python
from libc.stdlib cimport atoi

cdef parse_charptr_to_py_int(char* s):
    assert s is not NULL, "byte string value is NULL"
    return atoi(s)  # note: atoi() has no error detection!
```

:::tip
assert True, "or print this"
:::

`cdef`意味着我们是从C语言层面上定义的这个函数, Python是不能够直接导入的, 因此我们需要一个`def`包装一下:

```python
def export_atoi(s: Str):
    s = s.encode() # 转换为bytes
    return parse_charptr_to_py_int(s)
```

或者, 可以直接用`cpdef`导出模块, 让编译器完成包装这一步:

```python
cpdef parse_charptr_to_py_int(char* s):
    assert s is not NULL, "byte string value is NULL"
    return atoi(s)  # note: atoi() has no error detection!
```

你可以在`Cython/includes/`中找到这些标准的cimport文件. 这些`.pyd`文件标准的可复用的Cython声明, 可以在模块间共享(参考[Sharing Declarations Between Cython Modules](https://cython.readthedocs.io/en/latest/src/userguide/sharing_declarations.html#sharing-declarations))

怎么这么多文件后缀? 

* The implementation files, carrying a .py or .pyx suffix.

* The definition files, carrying a .pxd suffix.

* The include files, carrying a .pxi suffix.

Cython有一个完整的CPython C/API集合. 例如，要在C编译时测试代码编译时使用的是哪个CPython版本，可以执行以下操作：

```python
from cpython.version cimport PY_VERSION_HEX

# Python version >= 3.2 final ?
print(PY_VERSION_HEX >= 0x030200F0)
```

Cython同样提供了C数学库:

```python
from libc.math cimport sin

cdef double f(double x):
    return sin(x * x)
```

## 动态链接

`libc`数学库的特殊之处在于, 在某些类似Unix的系统（如Linux）上, 它默认不链接. 除了cimport声明之外, 还必须将构建系统配置为链接到共享库`m`. 

> C标准主要由两部分组成, 一部分描述C的语法, 另一部分描述C标准库. C标准库定义了一组标准头文件, 每个头文件中包含一些相关的函数, 变量, 类型, 声明和宏定义. 要在一个平台上支持C语言, 不仅要实现C编译器, 还要实现C标准库, 这样的实现才算符合C标准. 不符合C标准的实现也是存在的, 例如很多单片机的C语言开发工具中只有C编译器而没有完整的C标准库
 
> 在Linux平台上最广泛使用的C函数库是glibc, 其中包括C标准库的实现. 几乎所有C程序都要调用glibc的库函数, 所以glibc是Linux平台C程序运行的基础. glibc提供一组头文件和一组库文件, 最基本最常用的C标准库函数和系统函数在libc.so库文件中, 几乎所有C程序的运行都依赖于libc.so. 有些做数学计算的C程序依赖于libm.so, 通常位于/lib目录下. -lm选项告诉编译器, 我们程序中用到的数学函数要到这个库文件里找

对于setuptools, 将其添加到Extension()设置的libraries参数就足够了：

```python
from setuptools import Extension, setup
from Cython.Build import cythonize

ext_modules = [
    Extension("demo",
              sources=["demo.pyx"],
              libraries=["m"]  # Unix-like specific
              )
]

setup(name="Demos",
      ext_modules=cythonize(ext_modules))
```

## 外部声明

如果需要那些Cython还没有提供的声明, 你需要这样做:

```python
cdef extern from "math.h":
    double sin(double x)
```

这意味着Cython不会去解析`math.h`, 而是由C编译去编译这一部分.

就像数学库中的sin()函数一样, 只要Cython生成的模块与共享库或静态库正确链接, 就可以声明并调用任何C库.

通过使用`cpdef`语法, 把一个C函数从你的Cython模块中导出, 然后被Python代码使用. 这将会生成一个装饰器, 然后将其加入到模块的字典中:

```python
"""
>>> sin(0)
0.0
"""

cdef extern from "math.h":
    cpdef double sin(double x)
```

## 命名参数

C和Cython都支持没有参数名的函数签名:

```python
cdef extern from "string.h":
    char* strstr(const char*, const char*)
```
