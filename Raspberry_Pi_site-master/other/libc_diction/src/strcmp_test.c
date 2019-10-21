#include <stdio.h>

int my_strcmp(const char *s1, const char *s2)
{
	int i = 0;
	fprintf(stdout, "s1 : %s\n", s1);
	fprintf(stdout, "s2 : %s\n", s2);

	while (*s1 == *s2++)
	{
		fprintf(stdout, "count : %d\n", i);
		
		fprintf(stdout, "s1 : %c\n", *s1);
		fprintf(stdout, "s2 : %c\n", *s2);
		
		if (*s1++ == '\0')
		{
			return 0;
		}
		i++;
	}
	return(*s1 - * (s2-1));
}

int main(int argc, char const *argv[])
{
	int res;

	if (argc < 2)
	{
		fprintf(stdout, "Few argc error\n");
		return 1;
	}
	res = my_strcmp(argv[1], argv[2]);

	fprintf(stdout, "%d\n", res);
	return 0;
}
